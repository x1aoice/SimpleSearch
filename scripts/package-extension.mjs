import { deflateRawSync } from 'node:zlib';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(workspace, 'manifest.json'), 'utf8'));
const packageName = `SimpleSearch-${manifest.version}`;
const distRoot = path.join(workspace, 'dist');
const stagePath = path.join(distRoot, packageName);
const zipPath = path.join(distRoot, `${packageName}.zip`);
const runtimePaths = [
    'manifest.json',
    'index.html',
    'styles.css',
    'favicon.svg',
    'icons',
    '_locales',
    'src',
];

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[i] = value >>> 0;
}

function assertInWorkspace(target) {
    const resolved = path.resolve(target);
    const root = `${workspace}${path.sep}`;

    if (resolved !== workspace && !resolved.startsWith(root)) {
        throw new Error(`Refusing to operate outside workspace: ${resolved}`);
    }
}

function crc32(buffer) {
    let value = 0xffffffff;
    for (const byte of buffer) {
        value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
    }
    return (value ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
    const year = Math.max(date.getFullYear(), 1980);
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { dosDate, dosTime };
}

function writeUInt16(value) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(value);
    return buffer;
}

function writeUInt32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value >>> 0);
    return buffer;
}

async function copyRuntimeFile(source, destination) {
    assertInWorkspace(source);
    assertInWorkspace(destination);

    const sourceStat = await stat(source);
    if (sourceStat.isDirectory()) {
        await mkdir(destination, { recursive: true });
        const entries = await readdir(source);
        for (const entry of entries) {
            await copyRuntimeFile(path.join(source, entry), path.join(destination, entry));
        }
        return;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(source));
}

async function collectFiles(directory, base = directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await collectFiles(fullPath, base));
        } else if (entry.isFile()) {
            files.push({
                fullPath,
                zipPath: path.relative(base, fullPath).split(path.sep).join('/'),
            });
        }
    }

    return files.sort((a, b) => a.zipPath.localeCompare(b.zipPath));
}

async function createZip(sourceDirectory, destinationZip) {
    const files = await collectFiles(sourceDirectory);
    const output = [];
    const centralDirectory = [];
    let offset = 0;

    for (const file of files) {
        const sourceStat = await stat(file.fullPath);
        const name = Buffer.from(file.zipPath, 'utf8');
        const data = await readFile(file.fullPath);
        const compressed = deflateRawSync(data, { level: 9 });
        const checksum = crc32(data);
        const { dosDate, dosTime } = dosDateTime(sourceStat.mtime);
        const localHeader = Buffer.concat([
            writeUInt32(0x04034b50),
            writeUInt16(20),
            writeUInt16(0x0800),
            writeUInt16(8),
            writeUInt16(dosTime),
            writeUInt16(dosDate),
            writeUInt32(checksum),
            writeUInt32(compressed.length),
            writeUInt32(data.length),
            writeUInt16(name.length),
            writeUInt16(0),
            name,
        ]);

        const centralHeader = Buffer.concat([
            writeUInt32(0x02014b50),
            writeUInt16(20),
            writeUInt16(20),
            writeUInt16(0x0800),
            writeUInt16(8),
            writeUInt16(dosTime),
            writeUInt16(dosDate),
            writeUInt32(checksum),
            writeUInt32(compressed.length),
            writeUInt32(data.length),
            writeUInt16(name.length),
            writeUInt16(0),
            writeUInt16(0),
            writeUInt16(0),
            writeUInt16(0),
            writeUInt32(constants.S_IRUSR | constants.S_IWUSR),
            writeUInt32(offset),
            name,
        ]);

        output.push(localHeader, compressed);
        centralDirectory.push(centralHeader);
        offset += localHeader.length + compressed.length;
    }

    const centralDirectorySize = centralDirectory.reduce((total, buffer) => total + buffer.length, 0);
    const endOfCentralDirectory = Buffer.concat([
        writeUInt32(0x06054b50),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(files.length),
        writeUInt16(files.length),
        writeUInt32(centralDirectorySize),
        writeUInt32(offset),
        writeUInt16(0),
    ]);

    await writeFile(destinationZip, Buffer.concat([...output, ...centralDirectory, endOfCentralDirectory]));
}

assertInWorkspace(distRoot);
assertInWorkspace(stagePath);
assertInWorkspace(zipPath);

await mkdir(distRoot, { recursive: true });
await rm(stagePath, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(stagePath, { recursive: true });

for (const relativePath of runtimePaths) {
    await copyRuntimeFile(path.join(workspace, relativePath), path.join(stagePath, relativePath));
}

await createZip(stagePath, zipPath);

console.log(`Created ${zipPath}`);
console.log(`Created ${stagePath}`);

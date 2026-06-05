import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = await readJson('manifest.json');
const runtimeFiles = [
    'manifest.json',
    'index.html',
    'styles.css',
    'favicon.svg',
    'src/app.js',
    'src/commands.js',
    'src/config.js',
    'src/custom-engines.js',
    'src/i18n.js',
    'src/search.js',
    'src/storage.js',
    'src/url.js',
    '_locales/en/messages.json',
    '_locales/zh_CN/messages.json',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png',
];

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.default_locale, 'en');
assert.deepEqual(manifest.chrome_url_overrides, { newtab: 'index.html' });
assert.deepEqual(manifest.content_security_policy, {
    extension_pages: "script-src 'self'; object-src 'self';",
});
assert.deepEqual(manifest.permissions, ['search']);
assert.equal(manifest.host_permissions, undefined);
assert.equal(manifest.background, undefined);
assert.equal(manifest.content_scripts, undefined);

for (const file of runtimeFiles) {
    await access(new URL(file, root));
}

for (const size of [16, 32, 48, 128]) {
    const icon = await stat(new URL(`icons/icon-${size}.png`, root));
    assert.ok(icon.size > 0, `icon-${size}.png is empty`);
}

const sources = await Promise.all(
    ['index.html', 'src/app.js', 'src/i18n.js'].map(file => readFile(new URL(file, root), 'utf8')),
);

assert.doesNotMatch(sources.join('\n'), /<script(?! type="module" src="src\/app\.js"><\/script>)/i);
assert.doesNotMatch(sources.join('\n'), /https:\/\/cdn\.|http:\/\/cdn\.|unsafe-eval|unsafe-inline/i);

console.log(`Extension manifest is valid: SimpleSearch ${manifest.version}`);

async function readJson(file) {
    return JSON.parse(await readFile(new URL(file, root), 'utf8'));
}

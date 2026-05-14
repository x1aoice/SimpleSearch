import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

test('declares a minimal new tab extension manifest', async () => {
    const [manifest, enMessages, zhMessages] = await Promise.all([
        readJson('../manifest.json'),
        readJson('../_locales/en/messages.json'),
        readJson('../_locales/zh_CN/messages.json'),
    ]);

    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.default_locale, 'en');
    assert.equal(manifest.name, '__MSG_extName__');
    assert.equal(manifest.short_name, '__MSG_extShortName__');
    assert.equal(manifest.description, '__MSG_extDescription__');
    assert.equal(manifest.homepage_url, 'https://github.com/x1aoice/SimpleSearch');
    assert.deepEqual(manifest.content_security_policy, {
        extension_pages: "script-src 'self'; object-src 'self';",
    });
    assert.deepEqual(manifest.chrome_url_overrides, { newtab: 'index.html' });
    assert.equal(manifest.permissions, undefined);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(enMessages.extName.message, 'SimpleSearch');
    assert.equal(zhMessages.extName.message, 'SimpleSearch');
    assert.match(zhMessages.extDescription.message, /新标签页/);
    assert.deepEqual(manifest.icons, {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
    });

    await Promise.all(
        Object.values(manifest.icons).map(async iconPath => {
            const icon = await stat(new URL(`../${iconPath}`, import.meta.url));
            assert.equal(icon.isFile(), true);
            assert.ok(icon.size > 0);
        }),
    );
});

async function readJson(path) {
    return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

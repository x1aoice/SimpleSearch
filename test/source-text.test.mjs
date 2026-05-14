import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('keeps localized UI text wired through readable source files', async () => {
    const [html, app, i18n, zhMessages] = await Promise.all([
        readFile(new URL('../index.html', import.meta.url), 'utf8'),
        readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
        readFile(new URL('../src/i18n.js', import.meta.url), 'utf8'),
        readFile(new URL('../_locales/zh_CN/messages.json', import.meta.url), 'utf8'),
    ]);
    const source = `${html}\n${app}\n${i18n}\n${zhMessages}`;

    assert.match(html, /id="custom-engine-color" type="text"/);
    assert.doesNotMatch(html, /id="custom-engine-color" type="color"/);
    assert.match(html, /data-i18n-aria-label="search"/);
    assert.match(html, /data-i18n="urlTemplateLabel"/);
    assert.match(html, /data-i18n="color"/);
    assert.match(app, /textContent = t\('edit'/);
    assert.match(app, /textContent = t\('add'/);
    assert.match(i18n, /URL（用 %s 代替搜索字词）/);
    assert.match(zhMessages, /"message": "颜色"/);
    assert.doesNotMatch(source, /鎼滅储|缂栬緫|鍒犻櫎|娣诲姞|淇濆瓨/);
});

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
    assert.match(html, /id="custom-engine-key" type="text" maxlength="17"/);
    assert.match(html, /<form id="search-form" autocomplete="off">/);
    assert.match(html, /id="measure" class="measure typo" aria-hidden="true"/);
    assert.match(html, /class="idle-caret" aria-hidden="true"/);
    assert.doesNotMatch(html, /action="https:\/\/www\.google\.com\/search"/);
    assert.doesNotMatch(html, /name="q"/);
    assert.doesNotMatch(html, /id="custom-engine-color" type="color"/);
    assert.match(html, /data-i18n-aria-label="search"/);
    assert.match(html, /data-i18n="urlTemplateLabel"/);
    assert.match(html, /data-i18n="color"/);
    assert.match(app, /textContent = t\('edit'/);
    assert.match(app, /value\.slice\(0, cursorIndex\)/);
    assert.match(app, /style\.setProperty\('--caret-x'/);
    assert.match(app, /navigateFromInput\(event\.shiftKey\)/);
    assert.match(app, /const hasSelection = inputElement\.selectionStart !== inputElement\.selectionEnd/);
    assert.match(app, /document\.addEventListener\('selectionchange'/);
    assert.match(app, /event\.composedPath\?\.\(\)/);
    assert.match(app, /searchWithChromeDefault\(text\)/);
    assert.match(app, /oneShotEngineKey = key/);
    assert.match(app, /}, 400\)/);
    assert.doesNotMatch(app, /STORAGE_KEYS\.engine/);
    assert.doesNotMatch(app, /inputElement\.addEventListener\('input', \(\) => \{\s*triggerRecoil\(\);/);
    assert.doesNotMatch(app, /addEventListener\('keyup', updateUI\)/);
    assert.doesNotMatch(app, /style\.transition/);
    assert.match(i18n, /URL（用 %s 代替搜索字词）/);
    assert.match(zhMessages, /"message": "颜色"/);
    assert.doesNotMatch(source, /\u93bc\u6ec5\u50a8|\u7f02\u682c\u7deb|\u9352\u72bb\u6ace|\u5a23\u8bf2\u59de|\u6dc7\u6fc6\u74e8/);
});

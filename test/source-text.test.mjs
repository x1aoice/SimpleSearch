import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('keeps Chinese UI text readable in source files', async () => {
    const [html, app] = await Promise.all([
        readFile(new URL('../index.html', import.meta.url), 'utf8'),
        readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
    ]);
    const source = `${html}\n${app}`;

    assert.match(html, /aria-label="搜索"/);
    assert.match(html, /URL（用 %s 代替搜索字词）/);
    assert.match(app, /textContent = '编辑'/);
    assert.match(app, /textContent = '添加'/);
    assert.doesNotMatch(source, /鎼滅储|缂栬緫|鍒犻櫎|娣诲姞|淇濆瓨/);
});

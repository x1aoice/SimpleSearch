import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCommand } from '../src/commands.js';

test('resolves search engine commands', () => {
    const result = resolveCommand('b');
    assert.equal(result.type, 'engine');
    assert.equal(result.engine.label, 'Baidu');

    const duckDuckGo = resolveCommand('ddg');
    assert.equal(duckDuckGo.type, 'engine');
    assert.equal(duckDuckGo.engine.label, 'DuckDuckGo');
});

test('resolves custom search engine commands', () => {
    const result = resolveCommand('mdn', {
        mdn: {
            label: 'MDN',
            template: 'https://developer.mozilla.org/search?q=%s',
        },
    });

    assert.equal(result.type, 'engine');
    assert.equal(result.engine.label, 'MDN');
});

test('resolves utility commands', () => {
    assert.deepEqual(resolveCommand('dark'), { type: 'theme', theme: 'dark' });
    assert.deepEqual(resolveCommand('light'), { type: 'theme', theme: 'light' });
    assert.deepEqual(resolveCommand('help'), { type: 'help' });
    assert.deepEqual(resolveCommand('settings'), { type: 'settings' });
    assert.deepEqual(resolveCommand('set'), { type: 'settings' });
});

test('keeps unknown slash text searchable', () => {
    assert.deepEqual(resolveCommand('unknown'), { type: 'unknown', command: 'unknown' });
});

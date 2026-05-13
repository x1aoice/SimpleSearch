import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCommand } from '../src/commands.js';

test('resolves search engine commands', () => {
    const result = resolveCommand('b');
    assert.equal(result.type, 'engine');
    assert.equal(result.engine.label, 'Baidu');
});

test('resolves utility commands', () => {
    assert.deepEqual(resolveCommand('dark'), { type: 'theme', theme: 'dark' });
    assert.deepEqual(resolveCommand('light'), { type: 'theme', theme: 'light' });
    assert.deepEqual(resolveCommand('help'), { type: 'help' });
});

test('keeps unknown slash text searchable', () => {
    assert.deepEqual(resolveCommand('unknown'), { type: 'unknown', command: 'unknown' });
});

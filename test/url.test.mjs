import assert from 'node:assert/strict';
import test from 'node:test';
import { SEARCH_ENGINES } from '../src/config.js';
import { getSearchTarget, getURLTarget, isValidURL } from '../src/url.js';

test('detects regular web targets', () => {
    assert.equal(isValidURL('example.com'), true);
    assert.equal(getURLTarget('example.com'), 'https://example.com');
    assert.equal(getURLTarget('https://example.com/path'), 'https://example.com/path');
});

test('uses http for local targets', () => {
    assert.equal(getURLTarget('localhost:4173'), 'http://localhost:4173');
    assert.equal(getURLTarget('127.0.0.1:3000'), 'http://127.0.0.1:3000');
});

test('rejects invalid or unsafe URL-like input', () => {
    assert.equal(isValidURL('javascript://alert(1)'), false);
    assert.equal(isValidURL('999.999.999.999'), false);
    assert.equal(getURLTarget('hello world'), null);
});

test('builds search URLs from the selected engine', () => {
    assert.equal(
        getSearchTarget(SEARCH_ENGINES.g, '1.1.1.1'),
        'https://www.google.com/search?q=1.1.1.1',
    );
    assert.equal(
        getSearchTarget({ template: 'https://developer.mozilla.org/search?q=%s' }, 'array map'),
        'https://developer.mozilla.org/search?q=array%20map',
    );
});

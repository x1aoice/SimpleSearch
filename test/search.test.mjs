import assert from 'node:assert/strict';
import test from 'node:test';
import { getDefaultSearchFallback, searchWithChromeDefault } from '../src/search.js';

test('runs Chrome default search through the Search API', async () => {
    const previousChrome = globalThis.chrome;
    const calls = [];

    globalThis.chrome = {
        search: {
            query(options) {
                calls.push(options);
            },
        },
    };

    try {
        assert.equal(await searchWithChromeDefault('array map'), true);
        assert.deepEqual(calls, [{ text: 'array map', disposition: 'CURRENT_TAB' }]);
    } finally {
        globalThis.chrome = previousChrome;
    }
});

test('reports when Chrome Search API is unavailable', async () => {
    const previousChrome = globalThis.chrome;
    globalThis.chrome = undefined;

    try {
        assert.equal(await searchWithChromeDefault('array map'), false);
    } finally {
        globalThis.chrome = previousChrome;
    }
});

test('reports Chrome Search API failures', async () => {
    const previousChrome = globalThis.chrome;
    globalThis.chrome = {
        search: {
            async query() {
                throw new Error('search unavailable');
            },
        },
    };

    try {
        assert.equal(await searchWithChromeDefault('array map'), false);
    } finally {
        globalThis.chrome = previousChrome;
    }
});

test('keeps a browser-safe fallback for local development', () => {
    assert.equal(
        getDefaultSearchFallback('array map'),
        'https://www.google.com/search?q=array%20map',
    );
});

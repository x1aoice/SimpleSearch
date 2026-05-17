import assert from 'node:assert/strict';
import test from 'node:test';
import { searchWithDefaultProvider } from '../src/search.js';

test('uses Chrome Search API for default searches', async () => {
    const calls = [];
    const chromeApi = {
        search: {
            query(info) {
                calls.push(info);
            },
        },
    };
    const locationObject = { href: '' };

    await searchWithDefaultProvider('hello world', chromeApi, locationObject);

    assert.deepEqual(calls, [{ text: 'hello world', disposition: 'CURRENT_TAB' }]);
    assert.equal(locationObject.href, '');
});

test('falls back to Google only outside Chrome extension search API', async () => {
    const locationObject = { href: '' };

    await searchWithDefaultProvider('hello world', {}, locationObject);

    assert.equal(locationObject.href, 'https://www.google.com/search?q=hello%20world');
});

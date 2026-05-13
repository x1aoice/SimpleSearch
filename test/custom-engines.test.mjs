import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadCustomEngines,
    toEngineMap,
    validateCustomEngine,
} from '../src/custom-engines.js';

function createStorage(initialValue = null) {
    const data = new Map();
    if (initialValue !== null) data.set('customSearchEngines', initialValue);

    return {
        getItem(key) {
            return data.get(key) ?? null;
        },
        setItem(key, value) {
            data.set(key, value);
        },
    };
}

test('validates a custom search engine', () => {
    const result = validateCustomEngine({
        key: 'mdn',
        label: 'MDN',
        template: 'https://developer.mozilla.org/search?q=%s',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.key, 'mdn');
});

test('rejects reserved, duplicate, and invalid engines', () => {
    assert.equal(validateCustomEngine({
        key: 'g',
        label: 'Google again',
        template: 'https://example.com?q=%s',
    }).ok, false);
    assert.equal(validateCustomEngine({
        key: 'docs',
        label: 'Docs',
        template: 'https://example.com/search',
    }).ok, false);
    assert.equal(validateCustomEngine({
        key: 'mdn',
        label: 'MDN',
        template: 'https://developer.mozilla.org/search?q=%s',
    }, [{ key: 'mdn' }]).ok, false);
});

test('loads and maps valid custom engines from storage', () => {
    const storage = createStorage(JSON.stringify([
        { key: 'mdn', label: 'MDN', template: 'https://developer.mozilla.org/search?q=%s' },
    ]));
    const engines = loadCustomEngines(storage);
    const engineMap = toEngineMap(engines);

    assert.equal(engines.length, 1);
    assert.equal(engineMap.mdn.label, 'MDN');
    assert.equal(engineMap.g.label, 'Google');
});

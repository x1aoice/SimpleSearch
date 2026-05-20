import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH,
    DEFAULT_CUSTOM_ENGINE_COLOR,
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
    assert.equal(result.engine.color, DEFAULT_CUSTOM_ENGINE_COLOR);
});

test('adds https to a custom engine URL without a protocol', () => {
    const result = validateCustomEngine({
        key: 'mdn',
        label: 'MDN',
        template: 'developer.mozilla.org/search?q=%s',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.template, 'https://developer.mozilla.org/search?q=%s');
});

test('accepts uppercase custom engine URL tokens', () => {
    const result = validateCustomEngine({
        key: 'docs',
        label: 'Docs',
        template: 'search.example.com?q=%S',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.template, 'https://search.example.com?q=%s');
});

test('normalizes custom engine commands', () => {
    const result = validateCustomEngine({
        key: ' /MDN ',
        label: 'MDN',
        template: 'developer.mozilla.org/search?q=%s',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.key, 'mdn');
});

test('allows a 16 character command when typed with a slash', () => {
    const result = validateCustomEngine({
        key: '/abcdefghijklmnop',
        label: 'Long Command',
        template: 'https://example.com/search?q=%s',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.key, 'abcdefghijklmnop');
});

test('validates a custom search engine color', () => {
    const result = validateCustomEngine({
        key: 'docs',
        label: 'Docs',
        template: 'https://example.com/search?q=%s',
        color: '#FF8800',
    });

    assert.equal(result.ok, true);
    assert.equal(result.engine.color, '#ff8800');
});

test('limits custom engine URL length', () => {
    const baseTemplate = 'https://example.com/search?q=%s&pad=';
    const exactTemplate = `${baseTemplate}${'a'.repeat(CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH - baseTemplate.length)}`;

    assert.equal(exactTemplate.length, CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH);
    assert.equal(validateCustomEngine({
        key: 'exact',
        label: 'Exact URL',
        template: exactTemplate,
    }).ok, true);
    assert.equal(validateCustomEngine({
        key: 'long',
        label: 'Long URL',
        template: `${exactTemplate}a`,
    }).ok, false);
});

test('rejects reserved, duplicate, and invalid engines', () => {
    assert.equal(validateCustomEngine({
        key: 'add',
        label: 'Add',
        template: 'https://example.com?q=%s',
    }).ok, false);
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
    assert.equal(validateCustomEngine({
        key: 'ftp',
        label: 'FTP',
        template: 'ftp://example.com/search?q=%s',
    }).ok, false);
    assert.equal(validateCustomEngine({
        key: 'color',
        label: 'Color',
        template: 'https://example.com/search?q=%s',
        color: 'red',
    }).ok, false);
    assert.equal(validateCustomEngine({
        key: '/',
        label: 'Slash',
        template: 'https://example.com?q=%s',
    }).ok, false);
});

test('allows editing the same custom engine command', () => {
    const result = validateCustomEngine({
        key: 'mdn',
        label: 'MDN Web Docs',
        template: 'https://developer.mozilla.org/search?q=%s',
    }, [{ key: 'mdn' }], 'mdn');

    assert.equal(result.ok, true);
    assert.equal(result.engine.label, 'MDN Web Docs');
});

test('rejects editing a custom engine into another custom command', () => {
    const result = validateCustomEngine({
        key: 'docs',
        label: 'MDN Web Docs',
        template: 'https://developer.mozilla.org/search?q=%s',
    }, [{ key: 'mdn' }, { key: 'docs' }], 'mdn');

    assert.equal(result.ok, false);
});

test('loads and maps valid custom engines from storage', () => {
    const storage = createStorage(JSON.stringify([
        { key: 'mdn', label: 'MDN', template: 'https://developer.mozilla.org/search?q=%s', color: '#ff8800' },
        { key: '/MDN', label: 'Duplicate MDN', template: 'https://example.com/search?q=%s' },
        { key: 'bad', label: 'Bad', template: 'javascript://example.com/%s' },
    ]));
    const engines = loadCustomEngines(storage);
    const engineMap = toEngineMap(engines);

    assert.equal(engines.length, 1);
    assert.equal(engines[0].color, '#ff8800');
    assert.equal(engineMap.mdn.label, 'MDN');
    assert.equal(engineMap.mdn.color, '#ff8800');
    assert.equal(engineMap.g.label, 'Google');
});

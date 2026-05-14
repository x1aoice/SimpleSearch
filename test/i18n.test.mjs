import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { COMMAND_HELP, SHORTCUT_HELP } from '../src/config.js';
import { getLocale, t } from '../src/i18n.js';

test('normalizes extension UI languages', () => {
    assert.equal(getLocale('zh-CN'), 'zh-CN');
    assert.equal(getLocale('zh-HK'), 'zh-CN');
    assert.equal(getLocale('en-US'), 'en');
    assert.equal(getLocale('ja-JP'), 'en');
});

test('uses extension i18n messages when Chrome provides them', () => {
    const previousChrome = globalThis.chrome;
    globalThis.chrome = {
        i18n: {
            getUILanguage: () => 'zh-CN',
            getMessage: (key, substitutions = []) => {
                if (key === 'search') return '搜索';
                if (key === 'editingEngine') return `正在编辑 /${substitutions[0]}`;
                return '';
            },
        },
    };

    try {
        assert.equal(t('search'), '搜索');
        assert.equal(t('editingEngine', ['docs']), '正在编辑 /docs');
    } finally {
        globalThis.chrome = previousChrome;
    }
});

test('defines every UI translation key in English and Chinese', async () => {
    const [html, app, customEngines, enMessages, zhMessages] = await Promise.all([
        readFile(new URL('../index.html', import.meta.url), 'utf8'),
        readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
        readFile(new URL('../src/custom-engines.js', import.meta.url), 'utf8'),
        readJson('../_locales/en/messages.json'),
        readJson('../_locales/zh_CN/messages.json'),
    ]);

    const keys = new Set([
        ...matchAll(html, /data-i18n(?:-[a-z-]+)?="([^"]+)"/g),
        ...matchAll(app, /\bt\('([^']+)'/g),
        ...matchAll(customEngines, /validationError\('([^']+)'/g),
        ...COMMAND_HELP.map(item => item.descriptionKey),
        ...SHORTCUT_HELP.map(item => item.descriptionKey),
    ]);

    for (const key of keys) {
        assert.ok(enMessages[key], `missing English message: ${key}`);
        assert.ok(zhMessages[key], `missing Chinese message: ${key}`);
    }
});

function matchAll(source, pattern) {
    return [...source.matchAll(pattern)].map(match => match[1]);
}

async function readJson(path) {
    return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

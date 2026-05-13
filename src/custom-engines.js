import { SEARCH_ENGINES, STORAGE_KEYS } from './config.js';
import { safeGetItem, safeSetItem } from './storage.js';

const RESERVED_COMMANDS = new Set([
    ...Object.keys(SEARCH_ENGINES),
    'dark',
    'h',
    'help',
    'light',
    'set',
    'settings',
]);

export function loadCustomEngines(storage = window.localStorage) {
    try {
        const data = safeGetItem(storage, STORAGE_KEYS.customEngines);
        if (!data) return [];

        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(engine => normalizeCustomEngine(engine))
            .filter(Boolean)
            .filter((engine, index, engines) => engines.findIndex(item => item.key === engine.key) === index);
    } catch {
        return [];
    }
}

export function saveCustomEngines(engines, storage = window.localStorage) {
    safeSetItem(storage, STORAGE_KEYS.customEngines, JSON.stringify(engines));
}

export function toEngineMap(customEngines) {
    return {
        ...SEARCH_ENGINES,
        ...Object.fromEntries(customEngines.map(engine => [engine.key, engine])),
    };
}

export function validateCustomEngine(input, existingEngines = [], editingKey = '') {
    const key = input.key.trim().toLowerCase();
    const label = input.label.trim();
    const template = input.template.trim();

    if (!/^[a-z0-9]{1,16}$/.test(key)) {
        return { ok: false, message: '命令只能使用 1-16 个小写字母或数字。' };
    }

    if (RESERVED_COMMANDS.has(key)) {
        return { ok: false, message: '这个命令已被占用。' };
    }

    if (existingEngines.some(engine => engine.key === key && engine.key !== editingKey)) {
        return { ok: false, message: '这个命令已存在。' };
    }

    if (!label || label.length > 32) {
        return { ok: false, message: '名称需要 1-32 个字符。' };
    }

    if (!/^https?:\/\//i.test(template)) {
        return { ok: false, message: 'URL 需要以 http:// 或 https:// 开头。' };
    }

    if (!template.includes('%s')) {
        return { ok: false, message: 'URL 需要包含 %s。' };
    }

    try {
        new URL(template.replace('%s', 'test'));
    } catch {
        return { ok: false, message: 'URL 格式无效。' };
    }

    return {
        ok: true,
        engine: {
            key,
            label,
            template,
            color: '#111111',
        },
    };
}

function normalizeCustomEngine(engine) {
    if (!engine || typeof engine !== 'object') return null;

    const result = validateCustomEngine(
        {
            key: String(engine.key ?? ''),
            label: String(engine.label ?? ''),
            template: String(engine.template ?? ''),
        },
        [],
    );

    return result.ok ? result.engine : null;
}

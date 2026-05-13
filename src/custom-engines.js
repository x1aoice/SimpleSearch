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
export const CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH = 2048;
const TEMPLATE_PROTOCOL_PATTERN = /^([a-z][a-z0-9+.-]*):\/\//i;

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
    const rawTemplate = input.template.trim();
    const template = normalizeTemplate(rawTemplate);

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

    if (!rawTemplate) return { ok: false, message: 'URL 不能为空。' };
    if (template.length > CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH) return { ok: false, message: `URL 不能超过 ${CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH} 个字符。` };
    if (!isHttpTemplate(template)) return { ok: false, message: 'URL 只支持 http:// 或 https://。' };
    if (!template.includes('%s')) return { ok: false, message: 'URL 中用 %s 代替搜索字词。' };
    if (!isValidTemplateURL(template)) return { ok: false, message: 'URL 格式无效。' };

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

function normalizeTemplate(template) {
    if (!template || TEMPLATE_PROTOCOL_PATTERN.test(template)) return template;
    return `https://${template}`;
}

function isHttpTemplate(template) {
    return /^https?:\/\//i.test(template);
}

function isValidTemplateURL(template) {
    try {
        new URL(template.replaceAll('%s', 'test'));
        return true;
    } catch {
        return false;
    }
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

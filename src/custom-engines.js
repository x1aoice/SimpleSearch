import { SEARCH_ENGINES, STORAGE_KEYS } from './config.js';
import { safeGetItem, safeSetItem } from './storage.js';

const RESERVED_COMMANDS = new Set([
    ...Object.keys(SEARCH_ENGINES),
    'add',
    'dark',
    'h',
    'help',
    'light',
]);
export const CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH = 2048;
export const DEFAULT_CUSTOM_ENGINE_COLOR = '#111111';
const TEMPLATE_PROTOCOL_PATTERN = /^([a-z][a-z0-9+.-]*):\/\//i;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

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
    const color = String(input.color ?? DEFAULT_CUSTOM_ENGINE_COLOR).trim();

    if (!/^[a-z0-9]{1,16}$/.test(key)) {
        return validationError('customEngineCommandInvalid');
    }

    if (RESERVED_COMMANDS.has(key)) {
        return validationError('customEngineCommandReserved');
    }

    if (existingEngines.some(engine => engine.key === key && engine.key !== editingKey)) {
        return validationError('customEngineCommandDuplicate');
    }

    if (!label || label.length > 32) {
        return validationError('customEngineNameInvalid');
    }

    if (!rawTemplate) return validationError('customEngineUrlRequired');
    if (template.length > CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH) {
        return validationError('customEngineUrlTooLong', [String(CUSTOM_ENGINE_TEMPLATE_MAX_LENGTH)]);
    }
    if (!isHttpTemplate(template)) return validationError('customEngineUrlProtocolInvalid');
    if (!template.includes('%s')) return validationError('customEngineUrlTokenRequired');
    if (!isValidTemplateURL(template)) return validationError('customEngineUrlInvalid');
    if (!isValidColor(color)) return validationError('customEngineColorInvalid');

    return {
        ok: true,
        engine: {
            key,
            label,
            template,
            color: color.toLowerCase(),
        },
    };
}

function validationError(messageKey, substitutions = []) {
    return { ok: false, messageKey, substitutions };
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

function isValidColor(color) {
    return COLOR_PATTERN.test(color);
}

function normalizeCustomEngine(engine) {
    if (!engine || typeof engine !== 'object') return null;

    const result = validateCustomEngine(
        {
            key: String(engine.key ?? ''),
            label: String(engine.label ?? ''),
            template: String(engine.template ?? ''),
            color: String(engine.color ?? DEFAULT_CUSTOM_ENGINE_COLOR),
        },
        [],
    );

    return result.ok ? result.engine : null;
}

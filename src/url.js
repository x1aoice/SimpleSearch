import { SAFE_PROTOCOLS } from './config.js';

function hasSafeProtocol(value) {
    return SAFE_PROTOCOLS.has(value.replace(':', '').toLowerCase());
}

function getHost(input) {
    return input.split('/')[0];
}

function isLocalHost(host) {
    const normalized = host.replace(/:\d{2,5}$/, '').toLowerCase();
    return normalized === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized);
}

export function isValidURL(input) {
    const trimmed = input.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;

    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (protocolMatch) return hasSafeProtocol(protocolMatch[1]);

    const host = getHost(trimmed);
    const octet = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)';
    const validIPv4Pattern = new RegExp(`^${octet}(?:\\.${octet}){3}(?::\\d{2,5})?$`);
    const numericDottedPattern = /^(?:\d+\.)+\d+(?::\d{2,5})?$/;
    const hostPattern = new RegExp(`^(localhost|${octet}(?:\\.${octet}){3}|[a-z0-9-]+(?:\\.[a-z0-9-]+)+)(?::\\d{2,5})?$`, 'i');

    if (numericDottedPattern.test(host) && !validIPv4Pattern.test(host)) return false;
    if (!hostPattern.test(host)) return false;

    const path = trimmed.split('/').slice(1).join('/');
    return !path || !/\s/.test(path);
}

export function getURLTarget(input) {
    const trimmed = input.trim();
    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);

    if (protocolMatch) return hasSafeProtocol(protocolMatch[1]) ? trimmed : null;
    if (!isValidURL(trimmed)) return null;

    const protocol = isLocalHost(getHost(trimmed)) ? 'http' : 'https';
    return `${protocol}://${trimmed}`;
}

export function getSearchTarget(engine, input) {
    if (engine.template) {
        return engine.template.replaceAll('%s', encodeURIComponent(input));
    }

    return `${engine.action}?${engine.param}=${encodeURIComponent(input)}`;
}

export function getCommandSearch(input, engines) {
    const match = input.trim().match(/^\/([a-z0-9]{1,16})\s+(.+)$/i);
    if (!match) return null;

    const engine = engines[match[1].toLowerCase()];
    const query = match[2].trim();
    if (!engine || !query) return null;

    return {
        engine,
        query,
        target: getSearchTarget(engine, query),
    };
}

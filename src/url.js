import { SAFE_PROTOCOLS } from './config.js';

function hasSafeProtocol(value) {
    return SAFE_PROTOCOLS.has(value.replace(':', '').toLowerCase());
}

function getHost(input) {
    return input.split(/[/?#]/)[0];
}

function getHostParts(host) {
    if (!host || host.includes('@')) return null;

    const portMatch = host.match(/:(\d+)$/);
    if (host.includes(':') && !portMatch) return null;

    const hostname = portMatch ? host.slice(0, -(portMatch[0].length)) : host;
    const port = portMatch ? Number(portMatch[1]) : null;

    if (!hostname) return null;
    if (port !== null && (!Number.isInteger(port) || port < 0 || port > 65535)) return null;

    return { hostname, port };
}

function getHostname(host) {
    return getHostParts(host)?.hostname || '';
}

function isLocalHost(host) {
    const normalized = getHostname(host).toLowerCase();
    return normalized === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized);
}

function isValidAbsoluteURL(input) {
    try {
        const url = new URL(input);
        return hasSafeProtocol(url.protocol) && Boolean(url.hostname);
    } catch {
        return false;
    }
}

function isValidDomain(hostname) {
    if (hostname.length > 253) return false;

    const labels = hostname.split('.');
    if (labels.length < 2) return false;

    return labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export function isValidURL(input) {
    const trimmed = input.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;

    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (protocolMatch) return isValidAbsoluteURL(trimmed);

    const host = getHost(trimmed);
    const hostParts = getHostParts(host);
    const octet = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)';
    const validIPv4Pattern = new RegExp(`^${octet}(?:\\.${octet}){3}(?::\\d{1,5})?$`);
    const numericDottedPattern = /^(?:\d+\.)+\d+(?::\d{1,5})?$/;
    const hostname = hostParts?.hostname || '';

    if (!hostParts) return false;
    if (numericDottedPattern.test(host) && !validIPv4Pattern.test(host)) return false;
    if (
        hostname.toLowerCase() !== 'localhost'
        && !validIPv4Pattern.test(host)
        && !isValidDomain(hostname)
    ) return false;

    const path = trimmed.split('/').slice(1).join('/');
    if (path && /\s/.test(path)) return false;

    try {
        new URL(`${isLocalHost(host) ? 'http' : 'https'}://${trimmed}`);
        return true;
    } catch {
        return false;
    }
}

export function getURLTarget(input) {
    const trimmed = input.trim();
    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);

    if (protocolMatch) return isValidAbsoluteURL(trimmed) ? trimmed : null;
    if (!isValidURL(trimmed)) return null;

    const protocol = isLocalHost(getHost(trimmed)) ? 'http' : 'https';
    return `${protocol}://${trimmed}`;
}

export function getSearchTarget(engine, input) {
    if (engine.template) {
        return engine.template.replace(/%s/gi, encodeURIComponent(input));
    }

    return `${engine.action}?${engine.param}=${encodeURIComponent(input)}`;
}

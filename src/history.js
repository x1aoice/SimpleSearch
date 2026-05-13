import { MAX_HISTORY_SIZE, STORAGE_KEYS } from './config.js';
import { safeGetItem, safeRemoveItem, safeSetItem } from './storage.js';

export function loadSearchHistory(storage = window.localStorage) {
    try {
        const data = safeGetItem(storage, STORAGE_KEYS.history);
        if (!data) return [];

        const parsed = JSON.parse(data);
        return parsed
            .map(item => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
            .filter((item, index, arr) => index === 0 || arr[index - 1] !== item)
            .slice(-MAX_HISTORY_SIZE);
    } catch {
        return [];
    }
}

export function saveSearchHistory(history, storage = window.localStorage) {
    safeSetItem(storage, STORAGE_KEYS.history, JSON.stringify(history.slice(-MAX_HISTORY_SIZE)));
}

export function pushSearchHistory(history, value) {
    if (!value || history[history.length - 1] === value) return history;

    const next = [...history, value];
    return next.length > MAX_HISTORY_SIZE ? next.slice(-MAX_HISTORY_SIZE) : next;
}

export function clearSearchHistory(storage = window.localStorage) {
    safeRemoveItem(storage, STORAGE_KEYS.history);
}

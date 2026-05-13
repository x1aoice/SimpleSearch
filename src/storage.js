export function safeGetItem(storage, key) {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(storage, key, value) {
    try {
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

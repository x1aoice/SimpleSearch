import { DEFAULT_ENGINE_KEY, SEARCH_ENGINES } from './config.js';
import { getSearchTarget } from './url.js';

export async function searchWithChromeDefault(text) {
    const search = globalThis.chrome?.search;

    if (!search?.query) return false;

    try {
        await search.query({
            text,
            disposition: 'CURRENT_TAB',
        });
    } catch {
        return false;
    }

    return true;
}

export function getDefaultSearchFallback(text) {
    return getSearchTarget(SEARCH_ENGINES[DEFAULT_ENGINE_KEY], text);
}

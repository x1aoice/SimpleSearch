import { DEFAULT_ENGINE_KEY, SEARCH_ENGINES } from './config.js';
import { getSearchTarget } from './url.js';

export async function searchWithDefaultProvider(text, chromeApi = globalThis.chrome, locationObject = globalThis.location) {
    if (chromeApi?.search?.query) {
        await chromeApi.search.query({
            text,
            disposition: 'CURRENT_TAB',
        });
        return;
    }

    locationObject.href = getSearchTarget(SEARCH_ENGINES[DEFAULT_ENGINE_KEY], text);
}

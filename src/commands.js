import { SEARCH_ENGINES } from './config.js';

export function resolveCommand(command) {
    if (SEARCH_ENGINES[command]) {
        return { type: 'engine', key: command, engine: SEARCH_ENGINES[command] };
    }

    if (command === 'dark' || command === 'light') {
        return { type: 'theme', theme: command };
    }

    if (command === 'help' || command === 'h') {
        return { type: 'help' };
    }

    return { type: 'unknown', command };
}

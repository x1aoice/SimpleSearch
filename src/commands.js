import { SEARCH_ENGINES } from './config.js';

export function resolveCommand(command, engines = SEARCH_ENGINES) {
    if (engines[command]) {
        return { type: 'engine', key: command, engine: engines[command] };
    }

    if (command === 'dark' || command === 'light') {
        return { type: 'theme', theme: command };
    }

    if (command === 'help' || command === 'h') {
        return { type: 'help' };
    }

    if (command === 'add') {
        return { type: 'settings' };
    }

    return { type: 'unknown', command };
}

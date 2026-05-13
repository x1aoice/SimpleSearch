export const SEARCH_ENGINES = {
    g: { label: 'Google', action: 'https://www.google.com/search', param: 'q', color: '#4285F4' },
    b: { label: 'Baidu', action: 'https://www.baidu.com/s', param: 'wd', color: '#2932E1' },
    bi: { label: 'Bing', action: 'https://www.bing.com/search', param: 'q', color: '#00809d' },
    gh: { label: 'GitHub', action: 'https://github.com/search', param: 'q', color: '#A371F7' },
    dg: { label: 'DuckDuckGo', action: 'https://duckduckgo.com/', param: 'q', color: '#de5833' },
};

export const DEFAULT_ENGINE_KEY = 'g';
export const DEFAULT_THEME = 'system';
export const CARET_OFFSET = 15;
export const SAFE_PROTOCOLS = new Set(['http', 'https', 'ftp', 'ftps']);

export const STORAGE_KEYS = {
    customEngines: 'customSearchEngines',
    engine: 'defaultSearchEngine',
    theme: 'theme',
};

export const COMMAND_HELP = [
    { keys: '/help', description: '打开帮助' },
    { keys: '/set', description: '打开设置' },
    { keys: '/dark', description: '深色主题' },
    { keys: '/light', description: '浅色主题' },
];

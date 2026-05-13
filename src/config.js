export const SEARCH_ENGINES = {
    g: { label: 'Google', action: 'https://www.google.com/search', param: 'q', color: '#4285F4' },
    b: { label: 'Baidu', action: 'https://www.baidu.com/s', param: 'wd', color: '#2932E1' },
    bi: { label: 'Bing', action: 'https://www.bing.com/search', param: 'q', color: '#00809d' },
    gh: { label: 'GitHub', action: 'https://github.com/search', param: 'q', color: '#A371F7' },
    dg: { label: 'DuckDuckGo', action: 'https://duckduckgo.com/', param: 'q', color: '#de5833' },
};

export const THEME_OPTIONS = [
    { key: 'system', label: '系统' },
    { key: 'light', label: '浅色' },
    { key: 'dark', label: '深色' },
];

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
    { keys: '/settings', description: '打开设置' },
    { keys: '/dark', description: '深色主题' },
    { keys: '/light', description: '浅色主题' },
];

export const SHORTCUT_HELP = [
    { keys: 'Enter', description: '搜索，或直接打开 URL/IP' },
    { keys: 'Shift+Enter', description: '强制搜索当前输入' },
    { keys: 'Esc', description: '清空输入或关闭面板' },
];

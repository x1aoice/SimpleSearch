export const SEARCH_ENGINES = {
    g: { label: 'Google', action: 'https://www.google.com/search', param: 'q', color: '#4285F4' },
    b: { label: 'Baidu', action: 'https://www.baidu.com/s', param: 'wd', color: '#2932E1' },
    bi: { label: 'Bing', action: 'https://www.bing.com/search', param: 'q', color: '#00809d' },
    gh: { label: 'GitHub', action: 'https://github.com/search', param: 'q', color: '#A371F7' },
    v: { label: 'Bilibili', action: 'https://search.bilibili.com/all', param: 'keyword', color: '#FB7299' },
    z: { label: 'Zhihu', action: 'https://www.zhihu.com/search', param: 'q', color: '#0084FF' },
    y: { label: 'YouTube', action: 'https://www.youtube.com/results', param: 'search_query', color: '#FF0000' },
};

export const DEFAULT_ENGINE_KEY = 'g';
export const CARET_OFFSET = 15;
export const MAX_HISTORY_SIZE = 50;
export const SAFE_PROTOCOLS = new Set(['http', 'https', 'ftp', 'ftps']);

export const STORAGE_KEYS = {
    engine: 'defaultSearchEngine',
    history: 'searchHistory',
    theme: 'theme',
};

export const COMMAND_HELP = [
    { keys: '/help', description: '打开帮助' },
    { keys: '/dark', description: '深色主题' },
    { keys: '/light', description: '浅色主题' },
    { keys: '/clear', description: '清空历史' },
];

export const SHORTCUT_HELP = [
    { keys: 'Enter', description: '搜索，或直接打开 URL/IP' },
    { keys: 'Shift+Enter', description: '强制搜索当前输入' },
    { keys: 'Tab', description: '接受计算结果' },
    { keys: 'Up / Down', description: '浏览历史' },
    { keys: 'Esc', description: '清空输入或关闭帮助' },
];

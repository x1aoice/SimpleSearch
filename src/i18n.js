const FALLBACK_MESSAGES = {
    en: {
        extDescription: 'A clean, keyboard-first new tab search launcher with a terminal feel.',
        pageDescription: 'A clean search launcher with commands and custom search engines.',
        search: 'Search',
        searchWithEngine: 'Search $1',
        help: 'Help',
        searchEngines: 'Search Engines',
        commands: 'Commands',
        shortcuts: 'Shortcuts',
        customSearchEngines: 'Custom Search Engines',
        command: 'Command',
        name: 'Name',
        urlTemplateLabel: 'URL (use %s for search terms)',
        color: 'Color',
        flashColor: 'Flash color',
        add: 'Add',
        save: 'Save',
        edit: 'Edit',
        cancelEdit: 'Cancel Edit',
        emptyCustomEngines: 'No custom search engines yet',
        editEngine: 'Edit $1',
        deleteEngine: 'Delete $1',
        editingEngine: 'Editing /$1',
        commandOpenHelp: 'Open help',
        commandAddEngine: 'Add search engine',
        commandDarkTheme: 'Dark theme',
        commandLightTheme: 'Light theme',
        shortcutForceSearch: 'Force search the current input',
        customEngineCommandInvalid: 'Command must be 1-16 letters or numbers.',
        customEngineCommandReserved: 'This command is already reserved.',
        customEngineCommandDuplicate: 'This command already exists.',
        customEngineNameInvalid: 'Name must be 1-32 characters.',
        customEngineUrlRequired: 'URL is required.',
        customEngineUrlTooLong: 'URL must be $1 characters or less.',
        customEngineUrlProtocolInvalid: 'URL only supports http:// or https://.',
        customEngineUrlTokenRequired: 'Use %s in the URL for search terms.',
        customEngineUrlInvalid: 'URL format is invalid.',
        customEngineColorInvalid: 'Color format is invalid.',
    },
    'zh-CN': {
        extDescription: '终端风格的极简新标签页搜索启动器。',
        pageDescription: '支持命令与自定义搜索引擎的极简搜索启动器。',
        search: '搜索',
        searchWithEngine: '搜索 $1',
        help: '帮助',
        searchEngines: '搜索引擎',
        commands: '命令',
        shortcuts: '快捷键',
        customSearchEngines: '自定义搜索引擎',
        command: '命令',
        name: '名称',
        urlTemplateLabel: 'URL（用 %s 代替搜索字词）',
        color: '颜色',
        flashColor: '闪烁颜色',
        add: '添加',
        save: '保存',
        edit: '编辑',
        cancelEdit: '取消编辑',
        emptyCustomEngines: '还没有自定义搜索引擎',
        editEngine: '编辑 $1',
        deleteEngine: '删除 $1',
        editingEngine: '正在编辑 /$1',
        commandOpenHelp: '打开帮助',
        commandAddEngine: '添加搜索引擎',
        commandDarkTheme: '深色主题',
        commandLightTheme: '浅色主题',
        shortcutForceSearch: '强制搜索当前输入',
        customEngineCommandInvalid: '命令只能使用 1-16 个字母或数字。',
        customEngineCommandReserved: '这个命令已被占用。',
        customEngineCommandDuplicate: '这个命令已存在。',
        customEngineNameInvalid: '名称需要 1-32 个字符。',
        customEngineUrlRequired: 'URL 不能为空。',
        customEngineUrlTooLong: 'URL 不能超过 $1 个字符。',
        customEngineUrlProtocolInvalid: 'URL 只支持 http:// 或 https://。',
        customEngineUrlTokenRequired: 'URL 中用 %s 代替搜索字词。',
        customEngineUrlInvalid: 'URL 格式无效。',
        customEngineColorInvalid: '颜色格式无效。',
    },
};

function getExtensionMessage(key, substitutions) {
    const i18n = globalThis.chrome?.i18n;
    if (!i18n?.getMessage) return '';

    try {
        return i18n.getMessage(key, substitutions);
    } catch {
        return '';
    }
}

function getRawLocale() {
    return globalThis.chrome?.i18n?.getUILanguage?.()
        || globalThis.navigator?.language
        || 'en';
}

export function getLocale(rawLocale = getRawLocale()) {
    return rawLocale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function t(key, substitutions = []) {
    const normalizedSubstitutions = Array.isArray(substitutions) ? substitutions : [substitutions];
    const extensionMessage = getExtensionMessage(key, normalizedSubstitutions);

    if (extensionMessage) return extensionMessage;

    const locale = getLocale();
    const message = FALLBACK_MESSAGES[locale]?.[key] || FALLBACK_MESSAGES.en[key] || key;

    return normalizedSubstitutions.reduce(
        (text, value, index) => text.replaceAll(`$${index + 1}`, String(value)),
        message,
    );
}

export function applyI18n(root = document) {
    document.documentElement.lang = getLocale();

    root.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    root.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    root.querySelectorAll('[data-i18n-content]').forEach(element => {
        element.setAttribute('content', t(element.dataset.i18nContent));
    });
}

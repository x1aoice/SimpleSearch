import {
    CARET_OFFSET,
    COMMAND_HELP,
    DEFAULT_ENGINE_KEY,
    DEFAULT_THEME,
    SEARCH_ENGINES,
    SHORTCUT_HELP,
    STORAGE_KEYS,
    THEME_OPTIONS,
} from './config.js';
import { resolveCommand } from './commands.js';
import {
    loadCustomEngines,
    saveCustomEngines,
    toEngineMap,
    validateCustomEngine,
} from './custom-engines.js';
import { tryCalculate } from './calculator.js';
import { getSearchTarget, getURLTarget } from './url.js';
import { safeGetItem, safeRemoveItem, safeSetItem } from './storage.js';

const inputElement = document.getElementById('q');
const formElement = document.getElementById('search-form');
const caretElement = document.querySelector('.idle-caret');
const measureElement = document.getElementById('measure');
const ghostElement = document.getElementById('ghost');
const inputWrapper = document.querySelector('.input-wrapper');
const helpPanel = document.getElementById('help-panel');
const helpCloseButton = document.getElementById('help-close');
const settingsPanel = document.getElementById('settings-panel');
const settingsCloseButton = document.getElementById('settings-close');
const engineHelpElement = document.getElementById('engine-help');
const commandHelpElement = document.getElementById('command-help');
const shortcutHelpElement = document.getElementById('shortcut-help');
const settingsEnginesElement = document.getElementById('settings-engines');
const settingsThemesElement = document.getElementById('settings-themes');
const customEngineForm = document.getElementById('custom-engine-form');
const customEngineKeyInput = document.getElementById('custom-engine-key');
const customEngineLabelInput = document.getElementById('custom-engine-label');
const customEngineTemplateInput = document.getElementById('custom-engine-template');
const customEngineSubmitButton = document.getElementById('custom-engine-submit');
const customEngineCancelButton = document.getElementById('custom-engine-cancel');
const customEngineStateElement = document.getElementById('custom-engine-state');
const customEngineErrorElement = document.getElementById('custom-engine-error');
const customEngineListElement = document.getElementById('custom-engine-list');

let currentEngineKey = DEFAULT_ENGINE_KEY;
let customEngines = loadCustomEngines();
let searchEngines = toEngineMap(customEngines);
let currentEngine = searchEngines[currentEngineKey];
let currentTheme = DEFAULT_THEME;
let editingCustomEngineKey = '';
let calculatorResult = null;
let blinkTimer = null;
let jumpTimer = null;

function syncMeasureStyles() {
    const computedStyle = window.getComputedStyle(inputElement);
    measureElement.style.font = computedStyle.font;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
    measureElement.style.lineHeight = computedStyle.lineHeight;
}

function getGhostText() {
    if (calculatorResult !== null) return `= ${calculatorResult}`;
    return '';
}

function updateUI() {
    const value = inputElement.value;
    measureElement.textContent = value;

    const textWidth = measureElement.getBoundingClientRect().width;
    const wrapperWidth = inputWrapper.clientWidth;
    const offset = value.length ? CARET_OFFSET : 0;
    const caretPosition = textWidth + offset - inputElement.scrollLeft;
    const clampedPosition = Math.max(0, Math.min(caretPosition, wrapperWidth - 18));

    caretElement.style.transform = `translate(${clampedPosition}px, -50%) scale(1.3, 0.85)`;

    const ghostText = getGhostText();
    ghostElement.textContent = ghostText;
    ghostElement.style.transform = `translate(${ghostText ? clampedPosition + 25 : 0}px, -50%)`;

    caretElement.classList.remove('blink');
    caretElement.style.opacity = 1;

    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(() => {
        caretElement.style.transform = `translate(${clampedPosition}px, -50%) scale(1, 1)`;
    }, 100);

    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
        caretElement.classList.add('blink');
    }, 500);
}

function resetInputState() {
    inputElement.value = '';
    inputElement.scrollLeft = 0;
    calculatorResult = null;
    updateUI();
}

function renderDefinitionList(element, items) {
    element.replaceChildren();

    for (const item of items) {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = item.keys;
        description.textContent = item.description;
        element.append(term, description);
    }
}

function renderHelp() {
    renderDefinitionList(
        engineHelpElement,
        Object.entries(searchEngines).map(([key, engine]) => ({
            keys: `/${key}`,
            description: engine.label,
        })),
    );
    renderDefinitionList(commandHelpElement, COMMAND_HELP);
    renderDefinitionList(shortcutHelpElement, SHORTCUT_HELP);
}

function createChoiceButton(label, value, group) {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.type = 'button';
    button.dataset[group] = value;
    button.textContent = label;
    return button;
}

function renderSettings() {
    settingsEnginesElement.replaceChildren(
        ...Object.entries(searchEngines).map(([key, engine]) => createChoiceButton(engine.label, key, 'engine')),
    );
    settingsThemesElement.replaceChildren(
        ...THEME_OPTIONS.map(theme => createChoiceButton(theme.label, theme.key, 'theme')),
    );
    renderCustomEngines();
    updateSettingsState();
}

function renderCustomEngines() {
    if (!customEngines.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'custom-engine-empty';
        emptyState.textContent = '还没有自定义搜索引擎';
        customEngineListElement.replaceChildren(emptyState);
        return;
    }

    customEngineListElement.replaceChildren(
        ...customEngines.map(engine => {
            const row = document.createElement('div');
            const key = document.createElement('strong');
            const label = document.createElement('span');
            const template = document.createElement('span');
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');

            row.className = 'custom-engine-row';
            row.classList.toggle('editing', engine.key === editingCustomEngineKey);
            key.textContent = `/${engine.key}`;
            label.textContent = engine.label;
            template.textContent = engine.template;
            template.title = engine.template;
            editButton.className = 'choice-button edit-engine-button';
            editButton.type = 'button';
            editButton.dataset.editEngine = engine.key;
            editButton.ariaLabel = `编辑 ${engine.label}`;
            editButton.textContent = '编辑';
            deleteButton.className = 'choice-button delete-engine-button';
            deleteButton.type = 'button';
            deleteButton.dataset.deleteEngine = engine.key;
            deleteButton.ariaLabel = `删除 ${engine.label}`;
            deleteButton.textContent = '×';

            row.append(key, label, template, editButton, deleteButton);
            return row;
        }),
    );
}

function updateSettingsState() {
    for (const button of settingsEnginesElement.querySelectorAll('.choice-button')) {
        button.classList.toggle('active', button.dataset.engine === currentEngineKey);
    }

    for (const button of settingsThemesElement.querySelectorAll('.choice-button')) {
        button.classList.toggle('active', button.dataset.theme === currentTheme);
    }
}

function hidePanels() {
    helpPanel.hidden = true;
    settingsPanel.hidden = true;
}

function showHelp() {
    hidePanels();
    helpPanel.hidden = false;
}

function showSettings() {
    hidePanels();
    updateSettingsState();
    settingsPanel.hidden = false;
}

function setSearchEngine(key, savePreference = true, animate = true) {
    const engine = searchEngines[key];
    if (!engine) return;

    currentEngineKey = key;
    currentEngine = engine;
    formElement.action = engine.action || '';
    inputElement.name = engine.param || 'q';
    document.body.style.setProperty('--flash-color', engine.color);
    resetInputState();
    updateSettingsState();

    if (savePreference) {
        safeSetItem(localStorage, STORAGE_KEYS.engine, key);
    }

    if (!animate) return;

    caretElement.style.transition = 'none';
    ghostElement.style.transition = 'none';
    updateUI();

    caretElement.classList.remove('blink', 'flash-brand');
    void caretElement.offsetWidth;
    caretElement.classList.add('flash-brand');

    setTimeout(() => {
        caretElement.classList.remove('flash-brand');
        caretElement.style.transition = 'transform 0.1s cubic-bezier(0.25, 1.5, 0.5, 1), background-color 0.2s, opacity 0.5s ease';
        ghostElement.style.transition = 'transform 0.1s cubic-bezier(0.25, 1.5, 0.5, 1)';
        caretElement.classList.add('blink');
    }, 500);
}

function setTheme(theme, savePreference = true) {
    currentTheme = theme;

    if (theme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light-forced');
    } else if (theme === 'light') {
        document.body.classList.remove('dark');
        document.body.classList.add('light-forced');
    } else {
        document.body.classList.remove('dark', 'light-forced');
    }

    if (savePreference) {
        if (theme === DEFAULT_THEME) {
            safeRemoveItem(localStorage, STORAGE_KEYS.theme);
        } else {
            safeSetItem(localStorage, STORAGE_KEYS.theme, theme);
        }
    }

    updateSettingsState();
    setTimeout(updateUI, 50);
}

function triggerShake() {
    inputWrapper.classList.remove('shake');
    void inputWrapper.offsetWidth;
    inputWrapper.classList.add('shake');
}

function triggerRecoil() {
    inputWrapper.classList.remove('recoil');
    void inputWrapper.offsetWidth;
    inputWrapper.classList.add('recoil');
    setTimeout(() => inputWrapper.classList.remove('recoil'), 50);
}

function refreshCustomEngines(nextEngines) {
    customEngines = nextEngines;
    searchEngines = toEngineMap(customEngines);
    currentEngine = searchEngines[currentEngineKey] || searchEngines[DEFAULT_ENGINE_KEY];
    saveCustomEngines(customEngines);
    renderHelp();
    renderSettings();
}

function executeCommand(command) {
    const result = resolveCommand(command, searchEngines);

    if (result.type === 'engine') {
        setSearchEngine(result.key);
        return true;
    }

    if (result.type === 'theme') {
        setTheme(result.theme);
        resetInputState();
        return true;
    }

    if (result.type === 'help') {
        resetInputState();
        showHelp();
        return true;
    }

    if (result.type === 'settings') {
        resetInputState();
        showSettings();
        return true;
    }

    return false;
}

function resetCustomEngineForm() {
    editingCustomEngineKey = '';
    customEngineForm.reset();
    customEngineForm.classList.remove('editing');
    customEngineKeyInput.disabled = false;
    customEngineSubmitButton.textContent = '添加';
    customEngineCancelButton.hidden = true;
    customEngineStateElement.textContent = '';
    customEngineErrorElement.textContent = '';
    renderCustomEngines();
}

function editCustomEngine(key) {
    const engine = customEngines.find(item => item.key === key);
    if (!engine) return;

    editingCustomEngineKey = key;
    customEngineKeyInput.value = engine.key;
    customEngineLabelInput.value = engine.label;
    customEngineTemplateInput.value = engine.template;
    customEngineForm.classList.add('editing');
    customEngineSubmitButton.textContent = '保存';
    customEngineCancelButton.hidden = false;
    customEngineStateElement.textContent = `正在编辑 /${engine.key}`;
    customEngineErrorElement.textContent = '';
    renderCustomEngines();
    customEngineKeyInput.focus();
}

function saveCustomEngine() {
    const result = validateCustomEngine(
        {
            key: customEngineKeyInput.value,
            label: customEngineLabelInput.value,
            template: customEngineTemplateInput.value,
        },
        customEngines,
        editingCustomEngineKey,
    );

    if (!result.ok) {
        customEngineErrorElement.textContent = result.message;
        return;
    }

    const editedEngineKey = editingCustomEngineKey;
    const shouldKeepCurrentEngine = editedEngineKey && currentEngineKey === editedEngineKey;
    const nextEngines = editedEngineKey
        ? customEngines.map(engine => (engine.key === editedEngineKey ? result.engine : engine))
        : [...customEngines, result.engine];

    customEngineErrorElement.textContent = '';
    refreshCustomEngines(nextEngines);
    if (shouldKeepCurrentEngine) {
        setSearchEngine(result.engine.key, true, false);
    }
    resetCustomEngineForm();
    customEngineKeyInput.focus();
}

function deleteCustomEngine(key) {
    const nextEngines = customEngines.filter(engine => engine.key !== key);

    if (currentEngineKey === key) {
        setSearchEngine(DEFAULT_ENGINE_KEY);
    }

    if (editingCustomEngineKey === key) {
        resetCustomEngineForm();
    }

    customEngineErrorElement.textContent = '';
    refreshCustomEngines(nextEngines);
}

function navigateFromInput(forceSearch = false) {
    const value = inputElement.value.trim();

    if (!value) return false;

    document.body.classList.add('departing');

    setTimeout(() => {
        const urlTarget = forceSearch ? null : getURLTarget(value);
        window.location.href = urlTarget || getSearchTarget(currentEngine, value);
    }, 300);

    return true;
}

inputElement.addEventListener('input', () => {
    calculatorResult = tryCalculate(inputElement.value);
    triggerRecoil();
    updateUI();
});

inputElement.addEventListener('keydown', event => {
    const value = inputElement.value;

    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        navigateFromInput(true);
        return;
    }

    if (event.key === ' ' && value.startsWith('/') && !value.includes(' ')) {
        const command = value.slice(1).toLowerCase();
        if (executeCommand(command)) {
            event.preventDefault();
            return;
        }
    }

    if (event.key === 'Escape') {
        if (!helpPanel.hidden || !settingsPanel.hidden) {
            hidePanels();
            return;
        }

        inputElement.value = '';
        updateUI();
        return;
    }

    if (event.key === 'Tab' && calculatorResult !== null) {
        event.preventDefault();
        inputElement.value = String(calculatorResult);
        calculatorResult = null;
        updateUI();
        return;
    }
});

formElement.addEventListener('submit', event => {
    event.preventDefault();
    navigateFromInput();
});

window.addEventListener('pageshow', () => {
    document.body.classList.remove('departing');
    caretElement.classList.add('blink');
});

window.addEventListener('resize', () => {
    syncMeasureStyles();
    updateUI();
});

inputElement.addEventListener('scroll', updateUI);
inputElement.addEventListener('focus', updateUI);
inputWrapper.addEventListener('animationend', () => inputWrapper.classList.remove('shake'));
helpCloseButton.addEventListener('click', hidePanels);
settingsCloseButton.addEventListener('click', hidePanels);
settingsEnginesElement.addEventListener('click', event => {
    const button = event.target.closest('[data-engine]');
    if (!button) return;
    setSearchEngine(button.dataset.engine);
    inputElement.focus();
});
settingsThemesElement.addEventListener('click', event => {
    const button = event.target.closest('[data-theme]');
    if (!button) return;
    setTheme(button.dataset.theme);
    inputElement.focus();
});
customEngineForm.addEventListener('submit', event => {
    event.preventDefault();
    saveCustomEngine();
});
customEngineCancelButton.addEventListener('click', () => {
    resetCustomEngineForm();
    customEngineKeyInput.focus();
});
customEngineListElement.addEventListener('click', event => {
    const editButton = event.target.closest('[data-edit-engine]');
    if (editButton) {
        editCustomEngine(editButton.dataset.editEngine);
        return;
    }

    const button = event.target.closest('[data-delete-engine]');
    if (!button) return;
    deleteCustomEngine(button.dataset.deleteEngine);
});

document.addEventListener('click', event => {
    if (helpPanel.contains(event.target) || settingsPanel.contains(event.target)) return;
    inputElement.focus();
});

renderHelp();
renderSettings();

const savedEngine = safeGetItem(localStorage, STORAGE_KEYS.engine);
if (searchEngines[savedEngine]) {
    setSearchEngine(savedEngine, false, false);
} else {
    setSearchEngine(currentEngineKey, false, false);
}

const savedTheme = safeGetItem(localStorage, STORAGE_KEYS.theme);
setTheme(['dark', 'light'].includes(savedTheme) ? savedTheme : DEFAULT_THEME, false);

setTimeout(() => {
    syncMeasureStyles();
    updateUI();
}, 10);

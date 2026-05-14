import {
    CARET_OFFSET,
    COMMAND_HELP,
    DEFAULT_ENGINE_KEY,
    DEFAULT_THEME,
    SHORTCUT_HELP,
    STORAGE_KEYS,
} from './config.js';
import { resolveCommand } from './commands.js';
import {
    DEFAULT_CUSTOM_ENGINE_COLOR,
    loadCustomEngines,
    saveCustomEngines,
    toEngineMap,
    validateCustomEngine,
} from './custom-engines.js';
import { getSearchTarget, getURLTarget } from './url.js';
import { safeGetItem, safeRemoveItem, safeSetItem } from './storage.js';
import { applyI18n, t } from './i18n.js';

const inputElement = document.getElementById('q');
const formElement = document.getElementById('search-form');
const caretElement = document.querySelector('.idle-caret');
const measureElement = document.getElementById('measure');
const inputWrapper = document.querySelector('.input-wrapper');
const helpPanel = document.getElementById('help-panel');
const settingsPanel = document.getElementById('settings-panel');
const engineHelpElement = document.getElementById('engine-help');
const commandHelpElement = document.getElementById('command-help');
const shortcutHelpElement = document.getElementById('shortcut-help');
const customEngineForm = document.getElementById('custom-engine-form');
const customEngineKeyInput = document.getElementById('custom-engine-key');
const customEngineLabelInput = document.getElementById('custom-engine-label');
const customEngineTemplateInput = document.getElementById('custom-engine-template');
const customEngineColorInput = document.getElementById('custom-engine-color');
const customEngineSubmitButton = document.getElementById('custom-engine-submit');
const customEngineCancelButton = document.getElementById('custom-engine-cancel');
const customEngineStateElement = document.getElementById('custom-engine-state');
const customEngineErrorElement = document.getElementById('custom-engine-error');
const customEngineListElement = document.getElementById('custom-engine-list');

let currentEngineKey = DEFAULT_ENGINE_KEY;
let customEngines = loadCustomEngines();
let searchEngines = toEngineMap(customEngines);
let currentEngine = searchEngines[currentEngineKey];
let editingCustomEngineKey = '';
let blinkTimer = null;

function syncMeasureStyles() {
    const computedStyle = window.getComputedStyle(inputElement);
    measureElement.style.font = computedStyle.font;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
    measureElement.style.lineHeight = computedStyle.lineHeight;
}

function updateUI() {
    const value = inputElement.value;
    const cursorIndex = inputElement.selectionStart ?? value.length;
    const hasSelection = inputElement.selectionStart !== inputElement.selectionEnd;
    measureElement.textContent = value.slice(0, cursorIndex);

    const textWidth = measureElement.getBoundingClientRect().width;
    const wrapperWidth = inputWrapper.clientWidth;
    const caretWidth = caretElement.offsetWidth || 18;
    const offset = cursorIndex ? CARET_OFFSET : 0;
    const caretPosition = textWidth + offset - inputElement.scrollLeft;
    const clampedPosition = Math.max(0, Math.min(caretPosition, wrapperWidth - caretWidth));

    caretElement.style.setProperty('--caret-x', `${clampedPosition}px`);
    caretElement.classList.remove('blink');
    caretElement.style.opacity = hasSelection ? 0 : 1;

    if (hasSelection) {
        clearTimeout(blinkTimer);
        return;
    }

    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
        caretElement.classList.add('blink');
    }, 500);
}

function resetInputState() {
    inputElement.value = '';
    inputElement.scrollLeft = 0;
    updateUI();
}

function renderDefinitionList(element, items) {
    element.replaceChildren();

    for (const item of items) {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = item.keys;
        description.textContent = item.descriptionKey ? t(item.descriptionKey) : item.description;
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

function renderSettings() {
    renderCustomEngines();
}

function renderCustomEngines() {
    if (!customEngines.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'custom-engine-empty';
        emptyState.textContent = t('emptyCustomEngines');
        customEngineListElement.replaceChildren(emptyState);
        return;
    }

    customEngineListElement.replaceChildren(
        ...customEngines.map(engine => {
            const row = document.createElement('div');
            const key = document.createElement('strong');
            const label = document.createElement('span');
            const color = document.createElement('span');
            const template = document.createElement('span');
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');

            row.className = 'custom-engine-row';
            row.classList.toggle('editing', engine.key === editingCustomEngineKey);
            key.textContent = `/${engine.key}`;
            label.textContent = engine.label;
            color.className = 'custom-engine-color-code';
            color.textContent = engine.color;
            color.title = engine.color;
            template.textContent = engine.template;
            template.title = engine.template;
            editButton.className = 'choice-button edit-engine-button';
            editButton.type = 'button';
            editButton.dataset.editEngine = engine.key;
            editButton.ariaLabel = t('editEngine', [engine.label]);
            editButton.textContent = t('edit');
            deleteButton.className = 'choice-button delete-engine-button';
            deleteButton.type = 'button';
            deleteButton.dataset.deleteEngine = engine.key;
            deleteButton.ariaLabel = t('deleteEngine', [engine.label]);
            deleteButton.textContent = '×';

            row.append(key, label, color, template, editButton, deleteButton);
            return row;
        }),
    );
}

function hidePanels() {
    helpPanel.hidden = true;
    settingsPanel.hidden = true;
}

function isPanelInteraction(event) {
    const path = event.composedPath?.() || [];

    return path.includes(helpPanel)
        || path.includes(settingsPanel)
        || helpPanel.contains(event.target)
        || settingsPanel.contains(event.target);
}

function showHelp() {
    hidePanels();
    helpPanel.hidden = false;
}

function showSettings() {
    hidePanels();
    settingsPanel.hidden = false;
}

function setSearchEngine(key, savePreference = true, animate = true) {
    const engine = searchEngines[key];
    if (!engine) return;

    currentEngineKey = key;
    currentEngine = engine;
    formElement.action = engine.action || '';
    inputElement.name = engine.param || 'q';
    inputElement.setAttribute('aria-label', t('searchWithEngine', [engine.label]));
    document.body.style.setProperty('--flash-color', engine.color);
    resetInputState();

    if (savePreference) {
        safeSetItem(localStorage, STORAGE_KEYS.engine, key);
    }

    if (!animate) return;

    updateUI();

    caretElement.classList.remove('blink', 'flash-brand');
    void caretElement.offsetWidth;
    caretElement.classList.add('flash-brand');

    setTimeout(() => {
        caretElement.classList.remove('flash-brand');
        caretElement.classList.add('blink');
    }, 500);
}

function setTheme(theme, savePreference = true) {
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

    setTimeout(updateUI, 50);
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
    customEngineColorInput.value = DEFAULT_CUSTOM_ENGINE_COLOR;
    customEngineForm.classList.remove('editing');
    customEngineKeyInput.disabled = false;
    customEngineSubmitButton.textContent = t('add');
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
    customEngineColorInput.value = engine.color;
    customEngineForm.classList.add('editing');
    customEngineSubmitButton.textContent = t('save');
    customEngineCancelButton.hidden = false;
    customEngineStateElement.textContent = t('editingEngine', [engine.key]);
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
            color: customEngineColorInput.value,
        },
        customEngines,
        editingCustomEngineKey,
    );

    if (!result.ok) {
        customEngineErrorElement.textContent = t(result.messageKey, result.substitutions);
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
    }, 400);

    return true;
}

inputElement.addEventListener('input', () => {
    updateUI();
});

inputElement.addEventListener('keydown', event => {
    const value = inputElement.value;

    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        if (navigateFromInput(true)) triggerRecoil();
        return;
    }

    if (event.key === ' ' && value.startsWith('/') && !value.includes(' ')) {
        const command = value.slice(1).toLowerCase();
        if (executeCommand(command)) {
            event.preventDefault();
            triggerRecoil();
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
});

formElement.addEventListener('submit', event => {
    event.preventDefault();
    if (navigateFromInput()) triggerRecoil();
});

window.addEventListener('pageshow', () => {
    document.body.classList.remove('departing');
    caretElement.classList.add('blink');
    inputElement.focus();
});

window.addEventListener('resize', () => {
    syncMeasureStyles();
    updateUI();
});

inputElement.addEventListener('scroll', updateUI);
inputElement.addEventListener('focus', updateUI);
document.addEventListener('selectionchange', () => {
    if (document.activeElement === inputElement) updateUI();
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
    if (isPanelInteraction(event)) return;
    if (!helpPanel.hidden || !settingsPanel.hidden) hidePanels();
    inputElement.focus();
});

applyI18n();
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

requestAnimationFrame(() => document.body.classList.add('theme-ready'));

setTimeout(() => {
    syncMeasureStyles();
    updateUI();
}, 10);

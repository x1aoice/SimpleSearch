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
import { getDefaultSearchFallback, searchWithChromeDefault } from './search.js';
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
const colorPreviewElement = document.getElementById('color-preview');
const customEngineErrorElement = document.getElementById('custom-engine-error');
const customEngineListElement = document.getElementById('custom-engine-list');

let customEngines = loadCustomEngines();
let searchEngines = toEngineMap(customEngines);
let oneShotEngineKey = '';
let editingCustomEngineKey = '';
let blinkTimer = null;
let flashTimer = null;
let recoilTimer = null;
let navigationTimer = null;
let updateFrame = 0;
const errorShakeTimers = new WeakMap();

function triggerErrorShake(element) {
    if (!element) return;

    const existingTimer = errorShakeTimers.get(element);
    if (existingTimer) clearTimeout(existingTimer);

    element.classList.remove('error-shake');
    void element.offsetWidth;
    element.classList.add('error-shake');

    const timer = setTimeout(() => {
        element.classList.remove('error-shake');
        errorShakeTimers.delete(element);
    }, 260);
    errorShakeTimers.set(element, timer);
}

function syncMeasureStyles() {
    const computedStyle = window.getComputedStyle(inputElement);
    measureElement.style.font = computedStyle.font;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
    measureElement.style.lineHeight = computedStyle.lineHeight;
}

function updateUI() {
    if (updateFrame) {
        cancelAnimationFrame(updateFrame);
        updateFrame = 0;
    }

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
        blinkTimer = null;
    }, 500);
}

function scheduleUpdateUI() {
    if (updateFrame) return;

    updateFrame = requestAnimationFrame(() => {
        updateFrame = 0;
        updateUI();
    });
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

function createCustomEngineInput(field, value, maxLength, label) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.maxLength = maxLength;
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.dataset.engineField = field;
    input.setAttribute('aria-label', label);
    return input;
}

function createCustomEngineDisplayRow(engine) {
    const row = document.createElement('div');
    const key = document.createElement('strong');
    const label = document.createElement('span');
    const template = document.createElement('span');
    const color = document.createElement('span');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    row.className = 'custom-engine-row';
    key.textContent = `/${engine.key}`;
    label.textContent = engine.label;
    template.textContent = engine.template;
    template.title = engine.template;
    color.className = 'custom-engine-color-code';
    color.textContent = engine.color;
    color.title = engine.color;
    editButton.className = 'choice-button edit-engine-button';
    editButton.type = 'button';
    editButton.dataset.editEngine = engine.key;
    editButton.ariaLabel = t('editEngine', [engine.label]);
    editButton.textContent = t('edit');
    deleteButton.className = 'choice-button delete-engine-button';
    deleteButton.type = 'button';
    deleteButton.dataset.deleteEngine = engine.key;
    deleteButton.ariaLabel = t('deleteEngine', [engine.label]);
    deleteButton.textContent = '\u00d7';

    row.append(key, label, template, color, editButton, deleteButton);
    return row;
}

function createCustomEngineEditRow(engine) {
    const row = document.createElement('div');
    const saveButton = document.createElement('button');
    const cancelButton = document.createElement('button');

    row.className = 'custom-engine-row editing';
    row.dataset.editingEngine = engine.key;
    saveButton.className = 'choice-button edit-engine-button';
    saveButton.type = 'button';
    saveButton.dataset.saveEngine = engine.key;
    saveButton.textContent = t('save');
    cancelButton.className = 'choice-button delete-engine-button';
    cancelButton.type = 'button';
    cancelButton.dataset.cancelEngineEdit = engine.key;
    cancelButton.ariaLabel = t('cancelEdit');
    cancelButton.textContent = '\u00d7';

    row.append(
        createCustomEngineInput('key', engine.key, 17, t('command')),
        createCustomEngineInput('label', engine.label, 32, t('name')),
        createCustomEngineInput('template', engine.template, 2048, t('urlTemplateLabel')),
        createCustomEngineInput('color', engine.color, 7, t('color')),
        saveButton,
        cancelButton,
    );
    return row;
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
        ...customEngines.map(engine => (
            engine.key === editingCustomEngineKey
                ? createCustomEngineEditRow(engine)
                : createCustomEngineDisplayRow(engine)
        )),
    );
}

function hidePanels() {
    helpPanel.hidden = true;
    settingsPanel.hidden = true;
    document.body.classList.remove('panel-visible');
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
    document.body.classList.add('panel-visible');
    requestAnimationFrame(() => {
        if (!helpPanel.hidden) helpPanel.focus();
    });
}

function showSettings() {
    hidePanels();
    settingsPanel.hidden = false;
    document.body.classList.add('panel-visible');
    requestAnimationFrame(() => {
        if (!settingsPanel.hidden) customEngineKeyInput.focus();
    });
}

function clearArmedEngine() {
    oneShotEngineKey = '';
    inputElement.setAttribute('aria-label', t('search'));
    document.body.style.setProperty('--flash-color', searchEngines[DEFAULT_ENGINE_KEY].color);
}

function flashEngine(engine, animate = true) {
    if (flashTimer) {
        clearTimeout(flashTimer);
        flashTimer = null;
    }

    document.body.style.setProperty('--flash-color', engine.color);
    inputElement.setAttribute('aria-label', t('searchWithEngine', [engine.label]));
    resetInputState();
    caretElement.classList.remove('flash-brand');

    if (!animate) return;

    updateUI();

    caretElement.classList.remove('blink', 'flash-brand');
    void caretElement.offsetWidth;
    caretElement.classList.add('flash-brand');

    flashTimer = setTimeout(() => {
        caretElement.classList.remove('flash-brand');
        caretElement.classList.add('blink');
        flashTimer = null;
    }, 500);
}

function armSearchEngine(key, animate = true) {
    const engine = searchEngines[key];
    if (!engine) return;

    oneShotEngineKey = key;
    flashEngine(engine, animate);
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

    scheduleUpdateUI();
}

function triggerRecoil() {
    if (recoilTimer) {
        clearTimeout(recoilTimer);
        recoilTimer = null;
    }

    inputWrapper.classList.remove('recoil');
    void inputWrapper.offsetWidth;
    inputWrapper.classList.add('recoil');
    recoilTimer = setTimeout(() => {
        inputWrapper.classList.remove('recoil');
        recoilTimer = null;
    }, 150);
}

function refreshCustomEngines(nextEngines) {
    customEngines = nextEngines;
    searchEngines = toEngineMap(customEngines);
    if (oneShotEngineKey && !searchEngines[oneShotEngineKey]) {
        clearArmedEngine();
    }
    saveCustomEngines(customEngines);
    renderHelp();
    renderSettings();
}

function executeCommand(command) {
    const result = resolveCommand(command, searchEngines);

    if (result.type === 'engine') {
        armSearchEngine(result.key);
        return true;
    }

    if (result.type === 'theme') {
        clearArmedEngine();
        setTheme(result.theme);
        resetInputState();
        return true;
    }

    if (result.type === 'help') {
        clearArmedEngine();
        resetInputState();
        showHelp();
        return true;
    }

    if (result.type === 'settings') {
        clearArmedEngine();
        resetInputState();
        showSettings();
        return true;
    }

    return false;
}

function updateColorPreview() {
    const color = customEngineColorInput.value.trim();
    const isValidColor = /^#[0-9a-f]{6}$/i.test(color);

    colorPreviewElement.classList.toggle('invalid', !isValidColor);
    if (isValidColor) {
        colorPreviewElement.style.backgroundColor = color;
    } else {
        colorPreviewElement.style.backgroundColor = 'transparent';
    }
}

function resetCustomEngineForm() {
    editingCustomEngineKey = '';
    customEngineForm.reset();
    customEngineColorInput.value = DEFAULT_CUSTOM_ENGINE_COLOR;
    updateColorPreview();
    customEngineErrorElement.textContent = '';
    renderCustomEngines();
}

function getCustomEngineFormInput() {
    return {
        key: customEngineKeyInput.value,
        label: customEngineLabelInput.value,
        template: customEngineTemplateInput.value,
        color: customEngineColorInput.value,
    };
}

function getCustomEngineRowInput(row) {
    return {
        key: row.querySelector('[data-engine-field="key"]').value,
        label: row.querySelector('[data-engine-field="label"]').value,
        template: row.querySelector('[data-engine-field="template"]').value,
        color: row.querySelector('[data-engine-field="color"]').value,
    };
}

function focusEditingCustomEngine() {
    requestAnimationFrame(() => {
        const row = [...customEngineListElement.querySelectorAll('[data-editing-engine]')]
            .find(item => item.dataset.editingEngine === editingCustomEngineKey);
        row?.querySelector('[data-engine-field="key"]')?.focus();
    });
}

function editCustomEngine(key) {
    const engine = customEngines.find(item => item.key === key);
    if (!engine) return;

    editingCustomEngineKey = key;
    customEngineErrorElement.textContent = '';
    renderCustomEngines();
    focusEditingCustomEngine();
}

function commitCustomEngine(input, editingKey = '', feedbackElement = customEngineForm) {
    const result = validateCustomEngine(input, customEngines, editingKey);

    if (!result.ok) {
        customEngineErrorElement.textContent = t(result.messageKey, result.substitutions);
        triggerErrorShake(feedbackElement);
        return false;
    }

    const editedEngineKey = editingKey;
    const shouldRefreshArmedEngine = editedEngineKey && oneShotEngineKey === editedEngineKey;
    const nextEngines = editedEngineKey
        ? customEngines.map(engine => (engine.key === editedEngineKey ? result.engine : engine))
        : [...customEngines, result.engine];

    editingCustomEngineKey = '';
    customEngineErrorElement.textContent = '';
    refreshCustomEngines(nextEngines);
    if (shouldRefreshArmedEngine) {
        armSearchEngine(result.engine.key, false);
    }

    return true;
}

function saveCustomEngine() {
    if (!commitCustomEngine(getCustomEngineFormInput())) return;

    resetCustomEngineForm();
    customEngineKeyInput.focus();
}

function saveInlineCustomEngine(key, row) {
    if (!row || !commitCustomEngine(getCustomEngineRowInput(row), key, row)) return;

    customEngineKeyInput.focus();
}

function deleteCustomEngine(key) {
    const nextEngines = customEngines.filter(engine => engine.key !== key);

    if (oneShotEngineKey === key) {
        clearArmedEngine();
    }

    if (editingCustomEngineKey === key) editingCustomEngineKey = '';

    customEngineErrorElement.textContent = '';
    refreshCustomEngines(nextEngines);
}

function parseInlineEngineSearch(value) {
    const match = value.match(/^\/([a-z0-9]{1,16})\s+(.+)$/i);
    if (!match) return null;

    const key = match[1].toLowerCase();
    const engine = searchEngines[key];
    const text = match[2].trim();

    if (!engine || !text) return null;

    return { engine, text };
}

async function navigateToSearch(text, engine = null) {
    if (engine) {
        window.location.href = getSearchTarget(engine, text);
        return;
    }

    if (!(await searchWithChromeDefault(text))) {
        window.location.href = getDefaultSearchFallback(text);
    }
}

function navigateFromInput(forceSearch = false) {
    if (navigationTimer) return false;

    const value = inputElement.value.trim();

    if (!value) {
        triggerErrorShake(inputWrapper);
        return false;
    }

    const inlineEngineSearch = parseInlineEngineSearch(value);
    const searchText = inlineEngineSearch?.text || value;
    const selectedEngine = inlineEngineSearch?.engine || searchEngines[oneShotEngineKey] || null;

    document.body.classList.add('departing');

    navigationTimer = setTimeout(() => {
        navigationTimer = null;
        const urlTarget = forceSearch || inlineEngineSearch ? null : getURLTarget(value);

        if (urlTarget) {
            window.location.href = urlTarget;
            return;
        }

        navigateToSearch(searchText, selectedEngine);
    }, 400);

    return true;
}

inputElement.addEventListener('input', () => {
    scheduleUpdateUI();
});

inputElement.addEventListener('blur', () => {
    clearTimeout(blinkTimer);
    blinkTimer = null;
    caretElement.classList.remove('blink', 'flash-brand');
    caretElement.style.opacity = 0;
});

inputElement.addEventListener('keydown', event => {
    const value = inputElement.value;

    if (event.key === 'Enter') {
        event.preventDefault();
        if (navigateFromInput(event.shiftKey)) triggerRecoil();
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
        clearArmedEngine();
        updateUI();
        return;
    }
});

formElement.addEventListener('submit', event => {
    event.preventDefault();
    if (navigateFromInput()) triggerRecoil();
});

window.addEventListener('pageshow', () => {
    if (navigationTimer) {
        clearTimeout(navigationTimer);
        navigationTimer = null;
    }
    document.body.classList.remove('departing');
    caretElement.classList.add('blink');
    inputElement.focus();
});

window.addEventListener('resize', () => {
    syncMeasureStyles();
    scheduleUpdateUI();
});

inputElement.addEventListener('scroll', scheduleUpdateUI);
inputElement.addEventListener('focus', scheduleUpdateUI);
document.addEventListener('selectionchange', () => {
    if (document.activeElement === inputElement) scheduleUpdateUI();
});
customEngineForm.addEventListener('submit', event => {
    event.preventDefault();
    saveCustomEngine();
});
customEngineListElement.addEventListener('click', event => {
    const saveButton = event.target.closest('[data-save-engine]');
    if (saveButton) {
        saveInlineCustomEngine(saveButton.dataset.saveEngine, saveButton.closest('.custom-engine-row'));
        return;
    }

    const cancelButton = event.target.closest('[data-cancel-engine-edit]');
    if (cancelButton) {
        resetCustomEngineForm();
        return;
    }

    const editButton = event.target.closest('[data-edit-engine]');
    if (editButton) {
        editCustomEngine(editButton.dataset.editEngine);
        return;
    }

    const button = event.target.closest('[data-delete-engine]');
    if (!button) return;
    deleteCustomEngine(button.dataset.deleteEngine);
});

customEngineListElement.addEventListener('keydown', event => {
    if (!event.target.matches('[data-engine-field]')) return;

    const row = event.target.closest('.custom-engine-row');
    if (event.key === 'Enter') {
        event.preventDefault();
        saveInlineCustomEngine(row?.dataset.editingEngine, row);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        resetCustomEngineForm();
    }
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (helpPanel.hidden && settingsPanel.hidden) return;

    event.preventDefault();
    hidePanels();
    inputElement.focus();
});

document.addEventListener('click', event => {
    if (isPanelInteraction(event)) return;
    if (!helpPanel.hidden || !settingsPanel.hidden) hidePanels();
    inputElement.focus();
});

applyI18n();
renderHelp();
renderSettings();
clearArmedEngine();
updateColorPreview();

customEngineColorInput.addEventListener('input', updateColorPreview);

const savedTheme = safeGetItem(localStorage, STORAGE_KEYS.theme);
setTheme(['dark', 'light'].includes(savedTheme) ? savedTheme : DEFAULT_THEME, false);

requestAnimationFrame(() => document.body.classList.add('theme-ready'));

requestAnimationFrame(() => {
    syncMeasureStyles();
    updateUI();
});

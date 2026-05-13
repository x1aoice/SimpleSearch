import {
    CARET_OFFSET,
    COMMAND_HELP,
    DEFAULT_ENGINE_KEY,
    SEARCH_ENGINES,
    SHORTCUT_HELP,
    STORAGE_KEYS,
} from './config.js';
import { resolveCommand } from './commands.js';
import { tryCalculate } from './calculator.js';
import { getSearchTarget, getURLTarget } from './url.js';
import { safeGetItem, safeSetItem } from './storage.js';

const inputElement = document.getElementById('q');
const formElement = document.getElementById('search-form');
const caretElement = document.querySelector('.idle-caret');
const measureElement = document.getElementById('measure');
const ghostElement = document.getElementById('ghost');
const inputWrapper = document.querySelector('.input-wrapper');
const helpPanel = document.getElementById('help-panel');
const helpCloseButton = document.getElementById('help-close');
const engineHelpElement = document.getElementById('engine-help');
const commandHelpElement = document.getElementById('command-help');
const shortcutHelpElement = document.getElementById('shortcut-help');

let currentEngineKey = DEFAULT_ENGINE_KEY;
let currentEngine = SEARCH_ENGINES[currentEngineKey];
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

function getCommandHint(value) {
    if (!value.startsWith('/') || value.includes(' ')) return '';

    const command = value.slice(1).toLowerCase();
    if (!command) return '/help  /g  /b  /bi  /gh';

    return resolveCommand(command).type === 'unknown'
        ? 'Enter 搜索文本'
        : 'Space 执行';
}

function getGhostText(value) {
    if (calculatorResult !== null) return `= ${calculatorResult}`;
    if (!value) return '';

    const commandHint = getCommandHint(value);
    if (commandHint) return commandHint;

    return getURLTarget(value) ? 'Enter 打开  Shift+Enter 搜索' : '';
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

    const ghostText = getGhostText(value);
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
        Object.entries(SEARCH_ENGINES).map(([key, engine]) => ({
            keys: `/${key}`,
            description: engine.label,
        })),
    );
    renderDefinitionList(commandHelpElement, COMMAND_HELP);
    renderDefinitionList(shortcutHelpElement, SHORTCUT_HELP);
}

function showHelp() {
    helpPanel.hidden = false;
}

function hideHelp() {
    helpPanel.hidden = true;
}

function setSearchEngine(key, savePreference = true, animate = true) {
    const engine = SEARCH_ENGINES[key];
    if (!engine) return;

    currentEngineKey = key;
    currentEngine = engine;
    formElement.action = engine.action;
    inputElement.name = engine.param;
    document.body.style.setProperty('--flash-color', engine.color);
    resetInputState();

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
    if (theme === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light-forced');
    } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light-forced');
    }

    if (savePreference) {
        safeSetItem(localStorage, STORAGE_KEYS.theme, theme);
    }

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

function executeCommand(command) {
    const result = resolveCommand(command);

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

    return false;
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
        if (!helpPanel.hidden) {
            hideHelp();
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
helpCloseButton.addEventListener('click', hideHelp);

document.addEventListener('click', event => {
    if (helpPanel.contains(event.target)) return;
    inputElement.focus();
});

renderHelp();

const savedEngine = safeGetItem(localStorage, STORAGE_KEYS.engine);
if (SEARCH_ENGINES[savedEngine]) {
    setSearchEngine(savedEngine, false, false);
} else {
    setSearchEngine(currentEngineKey, false, false);
}

const savedTheme = safeGetItem(localStorage, STORAGE_KEYS.theme);
if (savedTheme) setTheme(savedTheme, false);

setTimeout(() => {
    syncMeasureStyles();
    updateUI();
}, 10);

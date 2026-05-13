/**
 * Search - Minimalist Search & Calculator
 * A clean, fast new tab page with multi-engine search and calculator
 */

// Configuration

const SEARCH_ENGINES = {
    g: { action: 'https://www.google.com/search', param: 'q', color: '#4285F4' },
    b: { action: 'https://www.baidu.com/s', param: 'wd', color: '#2932E1' },
    bi: { action: 'https://www.bing.com/search', param: 'q', color: '#00809d' },
    gh: { action: 'https://github.com/search', param: 'q', color: '#A371F7' },
    v: { action: 'https://search.bilibili.com/all', param: 'keyword', color: '#FB7299' },
    z: { action: 'https://www.zhihu.com/search', param: 'q', color: '#0084FF' },
    y: { action: 'https://www.youtube.com/results', param: 'search_query', color: '#FF0000' }
};

const CARET_OFFSET = 15;
const MAX_HISTORY_SIZE = 50;
const SAFE_PROTOCOLS = new Set(['http', 'https', 'ftp', 'ftps']);

// DOM Elements

const inputElement = document.getElementById('q');
const formElement = document.getElementById('search-form');
const caretElement = document.querySelector('.idle-caret');
const measureElement = document.getElementById('measure');
const ghostElement = document.getElementById('ghost');
const inputWrapper = document.querySelector('.input-wrapper');

// State

let searchHistory = loadSearchHistory();
let historyIndex = -1;
let tempInput = '';
let calculatorResult = null;
let blinkTimer = null;
let jumpTimer = null;

// Storage Helpers

function safeGetItem(storage, key) {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

function safeSetItem(storage, key, value) {
    try {
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

// History Management

function loadSearchHistory() {
    try {
        const data = safeGetItem(sessionStorage, 'searchHistory');
        if (!data) return [];

        const parsed = JSON.parse(data);
        return parsed
            .map(item => typeof item === 'string' ? item.trim() : '')
            .filter(Boolean)
            .filter((item, index, arr) => index === 0 || arr[index - 1] !== item);
    } catch {
        return [];
    }
}

function saveSearchHistory() {
    safeSetItem(sessionStorage, 'searchHistory', JSON.stringify(searchHistory));
}

// UI Updates

function syncMeasureStyles() {
    const computedStyle = window.getComputedStyle(inputElement);
    measureElement.style.font = computedStyle.font;
    measureElement.style.letterSpacing = computedStyle.letterSpacing;
    measureElement.style.fontVariantLigatures = computedStyle.fontVariantLigatures;
    measureElement.style.lineHeight = computedStyle.lineHeight;
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

    if (calculatorResult !== null) {
        ghostElement.textContent = `= ${calculatorResult}`;
        ghostElement.style.transform = `translate(${clampedPosition + 25}px, -50%)`;
    } else {
        ghostElement.textContent = '';
    }

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

// Calculator

function tokenize(input) {
    const tokens = [];
    let currentNumber = '';

    const pushNumber = () => {
        if (!currentNumber) return true;
        if (!/^\d*\.?\d+$/.test(currentNumber) && !/^\d+\.$/.test(currentNumber)) {
            return false;
        }
        tokens.push(currentNumber);
        currentNumber = '';
        return true;
    };

    for (const char of input) {
        if (/\d/.test(char) || char === '.') {
            if (char === '.' && currentNumber.includes('.')) return null;
            currentNumber += char;
        } else if (/\s/.test(char)) {
            if (!pushNumber()) return null;
        } else if ('+-*/()'.includes(char)) {
            if (!pushNumber()) return null;
            tokens.push(char);
        } else {
            return null;
        }
    }

    if (!pushNumber()) return null;
    return tokens.length ? tokens : null;
}

function toRPN(tokens) {
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    let lastToken = null;

    for (const token of tokens) {
        if (!isNaN(parseFloat(token))) {
            output.push(parseFloat(token));
            lastToken = 'num';
            continue;
        }

        if (token === '(') {
            operators.push(token);
            lastToken = '(';
            continue;
        }

        if (token === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') {
                output.push(operators.pop());
            }
            if (operators.pop() !== '(') return null;
            lastToken = ')';
            continue;
        }

        if ('+-*/'.includes(token)) {
            if ((token === '-' || token === '+') &&
                (lastToken === null || lastToken === '(' || lastToken === 'op')) {
                if (token === '-') output.push(0);
                if (token === '+') continue;
            } else {
                if (lastToken === 'op' || lastToken === null) return null;
            }

            while (operators.length) {
                const top = operators[operators.length - 1];
                if (top === '(' || precedence[top] < precedence[token]) break;
                output.push(operators.pop());
            }
            operators.push(token);
            lastToken = 'op';
            continue;
        }

        return null;
    }

    while (operators.length) {
        const op = operators.pop();
        if (op === '(') return null;
        output.push(op);
    }

    return output;
}

function evaluateRPN(rpn) {
    const stack = [];

    for (const token of rpn) {
        if (typeof token === 'number') {
            stack.push(token);
            continue;
        }

        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) return null;

        switch (token) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/': stack.push(b === 0 ? NaN : a / b); break;
            default: return null;
        }
    }

    return stack.length === 1 && isFinite(stack[0]) ? stack[0] : null;
}

function tryCalculate(input) {
    if (!input || input.endsWith(' ')) return null;

    const trimmed = input.trim();
    if (!/[+\-*/]/.test(trimmed)) return null;

    const tokens = tokenize(trimmed);
    if (!tokens) return null;

    const rpn = toRPN(tokens);
    if (!rpn) return null;

    const result = evaluateRPN(rpn);
    if (result === null) return null;

    const rounded = parseFloat(result.toPrecision(12));
    const formatted = Number.isInteger(rounded) ? rounded : parseFloat(rounded.toFixed(10));
    return String(formatted) === trimmed ? null : formatted;
}

// URL Detection

function isValidURL(input) {
    const trimmed = input.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;

    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (protocolMatch) {
        return SAFE_PROTOCOLS.has(protocolMatch[1].toLowerCase());
    }

    try {
        const url = new URL(trimmed);
        return SAFE_PROTOCOLS.has(url.protocol.replace(':', '').toLowerCase());
    } catch {}

    const parts = trimmed.split('/');
    const host = parts[0];
    const octet = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)';
    const hostPattern = new RegExp(`^(localhost|${octet}(?:\\.${octet}){3}|[a-z0-9-]+(?:\\.[a-z0-9-]+)+)(?::\\d{2,5})?$`, 'i');

    if (!hostPattern.test(host)) return false;

    const path = parts.slice(1).join('/');
    return !path || !/\s/.test(path);
}

function getURLTarget(input) {
    const trimmed = input.trim();
    const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);

    if (protocolMatch) {
        return SAFE_PROTOCOLS.has(protocolMatch[1].toLowerCase()) ? trimmed : null;
    }

    return isValidURL(trimmed) ? `https://${trimmed}` : null;
}

// Search Engine & Theme

function setSearchEngine(engine, key, savePreference = true) {
    formElement.action = engine.action;
    inputElement.name = engine.param;
    document.body.style.setProperty('--flash-color', engine.color);
    inputElement.value = '';
    inputElement.scrollLeft = 0;

    if (savePreference && key) {
        safeSetItem(localStorage, 'defaultSearchEngine', key);
    }

    // Trigger flash animation
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
        safeSetItem(localStorage, 'theme', theme);
    }

    setTimeout(updateUI, 50);
}

// Animations

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

// Event Listeners

inputElement.addEventListener('input', () => {
    calculatorResult = tryCalculate(inputElement.value);
    historyIndex = -1;
    triggerRecoil();
    updateUI();
});

inputElement.addEventListener('keydown', (event) => {
    const value = inputElement.value;

    if (event.key === ' ' && value.startsWith('/')) {
        const command = value.slice(1).toLowerCase();

        if (SEARCH_ENGINES[command]) {
            event.preventDefault();
            setSearchEngine(SEARCH_ENGINES[command], command);
            return;
        }

        if (command === 'dark') {
            event.preventDefault();
            setTheme('dark');
            return;
        }

        if (command === 'light') {
            event.preventDefault();
            setTheme('light');
            return;
        }
    }

    if (event.key === 'Escape') {
        inputElement.value = '';
        historyIndex = -1;
        updateUI();
        return;
    }

    if (event.key === 'Tab' && calculatorResult !== null) {
        event.preventDefault();
        inputElement.value = String(calculatorResult);
        calculatorResult = null;
        updateUI();
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (searchHistory.length) {
            if (historyIndex === -1) tempInput = inputElement.value;
            historyIndex = Math.min(historyIndex + 1, searchHistory.length - 1);
            inputElement.value = searchHistory[searchHistory.length - 1 - historyIndex];
            updateUI();
        }
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex > -1) {
            historyIndex--;
            inputElement.value = historyIndex === -1 ? tempInput : searchHistory[searchHistory.length - 1 - historyIndex];
            updateUI();
        }
    }

    if (event.key === 'Enter') {
        const trimmed = value.trim();
        if (trimmed.startsWith('/') && !trimmed.includes(' ')) {
            event.preventDefault();
            triggerShake();
        }
    }
});

formElement.addEventListener('submit', (event) => {
    const value = inputElement.value.trim();

    if (!value) {
        event.preventDefault();
        return;
    }

    if (value.startsWith('/') && !value.includes(' ')) {
        event.preventDefault();
        triggerShake();
        return;
    }

    if (searchHistory[searchHistory.length - 1] !== value) {
        searchHistory.push(value);
        if (searchHistory.length > MAX_HISTORY_SIZE) searchHistory.shift();
        saveSearchHistory();
    }

    event.preventDefault();
    document.body.classList.add('departing');

    setTimeout(() => {
        const urlTarget = getURLTarget(value);
        if (urlTarget) {
            window.location.href = urlTarget;
        } else {
            window.location.href = `${formElement.action}?${inputElement.name}=${encodeURIComponent(value)}`;
        }
    }, 300);
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
document.addEventListener('click', () => inputElement.focus());
inputWrapper.addEventListener('animationend', () => inputWrapper.classList.remove('shake'));

// Initialization

const savedEngine = safeGetItem(localStorage, 'defaultSearchEngine');
if (savedEngine && SEARCH_ENGINES[savedEngine]) {
    formElement.action = SEARCH_ENGINES[savedEngine].action;
    inputElement.name = SEARCH_ENGINES[savedEngine].param;
}

const savedTheme = safeGetItem(localStorage, 'theme');
if (savedTheme) setTheme(savedTheme, false);

setTimeout(() => {
    syncMeasureStyles();
    updateUI();
}, 10);

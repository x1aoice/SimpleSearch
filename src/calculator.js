function tokenize(input) {
    const tokens = [];
    let index = 0;

    while (index < input.length) {
        const char = input[index];

        if (/\s/.test(char)) {
            index += 1;
            continue;
        }

        if ('+-*/()'.includes(char)) {
            tokens.push({ type: char, value: char });
            index += 1;
            continue;
        }

        if (/\d/.test(char) || char === '.') {
            const start = index;
            let hasDigit = false;
            let hasDot = false;

            while (index < input.length) {
                const current = input[index];
                if (/\d/.test(current)) {
                    hasDigit = true;
                    index += 1;
                    continue;
                }

                if (current === '.' && !hasDot) {
                    hasDot = true;
                    index += 1;
                    continue;
                }

                break;
            }

            if (!hasDigit) return null;
            tokens.push({ type: 'number', value: Number.parseFloat(input.slice(start, index)) });
            continue;
        }

        return null;
    }

    return tokens;
}

function createParser(tokens) {
    let index = 0;

    const peek = () => tokens[index];
    const match = type => {
        if (peek()?.type !== type) return false;
        index += 1;
        return true;
    };

    const parsePrimary = () => {
        const token = peek();

        if (!token) return null;

        if (match('number')) return token.value;

        if (match('(')) {
            const value = parseExpression();
            if (value === null || !match(')')) return null;
            return value;
        }

        return null;
    };

    const parseUnary = () => {
        if (match('+')) return parseUnary();
        if (match('-')) {
            const value = parseUnary();
            return value === null ? null : -value;
        }

        return parsePrimary();
    };

    const parseTerm = () => {
        let value = parseUnary();
        if (value === null) return null;

        while (peek()?.type === '*' || peek()?.type === '/') {
            const operator = tokens[index].type;
            index += 1;
            const right = parseUnary();
            if (right === null) return null;

            value = operator === '*' ? value * right : value / right;
        }

        return value;
    };

    function parseExpression() {
        let value = parseTerm();
        if (value === null) return null;

        while (peek()?.type === '+' || peek()?.type === '-') {
            const operator = tokens[index].type;
            index += 1;
            const right = parseTerm();
            if (right === null) return null;

            value = operator === '+' ? value + right : value - right;
        }

        return value;
    }

    return {
        parse() {
            const value = parseExpression();
            return index === tokens.length ? value : null;
        },
    };
}

export function evaluateExpression(input) {
    const tokens = tokenize(input);
    if (!tokens?.length) return null;

    const result = createParser(tokens).parse();
    return Number.isFinite(result) ? result : null;
}

export function tryCalculate(input) {
    if (!input || input.endsWith(' ')) return null;

    const trimmed = input.trim();
    if (!/[+\-*/]/.test(trimmed)) return null;

    const result = evaluateExpression(trimmed);
    if (result === null) return null;

    const rounded = Number.parseFloat(result.toPrecision(12));
    const formatted = Number.isInteger(rounded) ? rounded : Number.parseFloat(rounded.toFixed(10));
    return String(formatted) === trimmed ? null : formatted;
}

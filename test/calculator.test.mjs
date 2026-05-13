import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression, tryCalculate } from '../src/calculator.js';

test('evaluates operator precedence and parentheses', () => {
    assert.equal(tryCalculate('1+2*3'), 7);
    assert.equal(tryCalculate('(1+2)*3'), 9);
});

test('handles unary signs without breaking multiplication', () => {
    assert.equal(tryCalculate('-3*2'), -6);
    assert.equal(tryCalculate('2*-3'), -6);
    assert.equal(tryCalculate('2--3'), 5);
});

test('rejects incomplete, non-calculator, and unsafe expressions', () => {
    assert.equal(tryCalculate('hello'), null);
    assert.equal(tryCalculate('1+'), null);
    assert.equal(tryCalculate('1/0'), null);
    assert.equal(evaluateExpression('1 + nope'), null);
});

test('does not show a result when the expression already equals itself', () => {
    assert.equal(tryCalculate('7'), null);
    assert.equal(tryCalculate('-7'), null);
});

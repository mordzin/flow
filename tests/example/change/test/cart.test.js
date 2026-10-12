import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../src/cart.js';

test('soma price * qty', () => {
  assert.equal(total([{ price: 10, qty: 2 }, { price: 5, qty: 1 }]), 25);
});

test('carrinho vazio', () => {
  assert.equal(total([]), 0);
});

test('cupom percentual reduz o total', () => {
  assert.ok(total([{ price: 100, qty: 1 }], 'PERC10') < 100);
});

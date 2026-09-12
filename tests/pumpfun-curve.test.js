import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteBuy, CURVE_PARAMS } from '../scripts/lib/pumpfun-curve.js';

test('1% (10M) quote is in the expected ballpark and internally consistent', () => {
  const q = quoteBuy(10_000_000);
  assert.equal(q.ok, true);
  assert.ok(q.rawSol > 0.25 && q.rawSol < 0.35, `rawSol ${q.rawSol}`);
  assert.ok(Math.abs(q.feeSol - q.rawSol * 0.0125) < 1e-9);
  assert.ok(q.totalSol > q.rawSol);
  assert.ok(q.withBuffer > q.totalSol);
});

test('quote is monotonic: more tokens cost more SOL', () => {
  const a = quoteBuy(10_000_000);
  const b = quoteBuy(64_150_000);
  assert.ok(b.totalSol > a.totalSol);
});

test('full 6.415% obligation is within the curve', () => {
  const q = quoteBuy(64_150_000);
  assert.equal(q.ok, true);
  assert.ok(q.percentOfSupply > 6.4 && q.percentOfSupply < 6.42);
});

test('an impossibly large buy is rejected, not guessed', () => {
  const q = quoteBuy(CURVE_PARAMS.virtualTokens + 1);
  assert.equal(q.ok, false);
});

test('non-positive amounts are rejected', () => {
  assert.equal(quoteBuy(0).ok, false);
  assert.equal(quoteBuy(-5).ok, false);
});

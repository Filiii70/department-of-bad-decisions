import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadConfig, validateConfig, isPlaceholder, isHttpUrl, isIsoTimestamp, EXPECTED,
} from '../scripts/lib/config.js';

test('canonical config loads and has required identity', () => {
  const cfg = loadConfig();
  assert.equal(cfg.project_name, EXPECTED.project_name);
  assert.equal(cfg.ticker, EXPECTED.ticker);
  assert.equal(cfg.network, EXPECTED.network);
});

test('canonical config is structurally valid (warnings allowed)', () => {
  const cfg = loadConfig();
  const { ok, errors } = validateConfig(cfg);
  assert.equal(ok, true, 'errors: ' + errors.join('; '));
});

test('validateConfig catches wrong ticker and network', () => {
  const cfg = loadConfig();
  const bad = { ...cfg, ticker: 'NOPE', network: 'ethereum' };
  const { ok, errors } = validateConfig(bad);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('ticker')));
  assert.ok(errors.some((e) => e.includes('network')));
});

test('validateConfig rejects short disclaimer', () => {
  const cfg = loadConfig();
  const bad = { ...cfg, disclaimer_text: 'too short' };
  const { ok } = validateConfig(bad);
  assert.equal(ok, false);
});

test('placeholder detection', () => {
  assert.equal(isPlaceholder('REPLACE_ME_CREATOR_WALLET'), true);
  assert.equal(isPlaceholder('https://x.com/REPLACE_ME_DBD'), true);
  assert.equal(isPlaceholder('https://x.com/realhandle'), false);
});

test('url and timestamp helpers', () => {
  assert.equal(isHttpUrl('https://x.com/a'), true);
  assert.equal(isHttpUrl('not a url'), false);
  assert.equal(isIsoTimestamp('2026-08-30T00:00:00Z'), true);
  assert.equal(isIsoTimestamp('yesterday'), false);
});

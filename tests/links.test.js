import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explorerTokenUrl, explorerAccountUrl, launchPlatformUrl } from '../scripts/lib/links.js';

const MINT = 'So11111111111111111111111111111111111111112';

test('explorer token url', () => {
  assert.equal(explorerTokenUrl('https://solscan.io', MINT), `https://solscan.io/token/${MINT}`);
  // trailing slash normalized
  assert.equal(explorerTokenUrl('https://solscan.io/', MINT), `https://solscan.io/token/${MINT}`);
  assert.equal(explorerTokenUrl('', MINT), null);
});

test('explorer account url', () => {
  assert.equal(explorerAccountUrl('https://solscan.io', MINT), `https://solscan.io/account/${MINT}`);
});

test('launch platform urls for known platforms', () => {
  assert.equal(launchPlatformUrl('pump.fun', MINT), `https://pump.fun/coin/${MINT}`);
  assert.equal(launchPlatformUrl('PumpFun', MINT), `https://pump.fun/coin/${MINT}`);
  assert.ok(launchPlatformUrl('raydium', MINT).includes(MINT));
  assert.ok(launchPlatformUrl('jupiter', MINT).includes(MINT));
});

test('unknown platform returns null rather than guessing', () => {
  assert.equal(launchPlatformUrl('someunknownexchange', MINT), null);
  assert.equal(launchPlatformUrl('pump.fun', null), null);
});

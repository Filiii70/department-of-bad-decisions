import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadConfig, MINT_NOT_ISSUED } from '../scripts/lib/config.js';
import { validateModerators } from '../scripts/prepare-moderator-locks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

test('production config stays pre-launch with no real mint', () => {
  const cfg = loadConfig();
  assert.equal(cfg.launch_status, 'prelaunch');
  assert.equal(cfg.official_mint, MINT_NOT_ISSUED);
});

test('real moderators.json is blocked until verified wallets are added', () => {
  const doc = JSON.parse(readFileSync(resolve(ROOT, 'launch/moderators.json'), 'utf8'));
  const res = validateModerators(doc);
  assert.equal(res.ok, false); // wallets intentionally empty pre-launch
  assert.ok(res.blockers.some((b) => b.toLowerCase().includes('missing wallet')));
  // amounts are still exactly 25M each
  for (const m of res.prepared) assert.equal(m.allocation_tokens, 25_000_000);
});

test('moderator amounts can never be anything other than 25M', () => {
  const tampered = { moderators: [
    { name: 'Zafir', wallet: 'So11111111111111111111111111111111111111112', allocation_tokens: 30_000_000 },
    { name: 'Emmanuel Crypt', wallet: 'BymiG3AzPu4jA7Aw4yrQD7qY6KXDUyEFtwN8z8WNQHsj', allocation_tokens: 25_000_000 },
  ] };
  const res = validateModerators(tampered);
  assert.equal(res.ok, false);
  assert.ok(res.blockers.some((b) => b.includes('exactly 25000000')));
});

test('no private keys or seed phrases in launch data files', () => {
  const files = ['launch/moderators.json', 'launch/member-submissions.csv'];
  for (const f of files) {
    const text = readFileSync(resolve(ROOT, f), 'utf8');
    for (const forbidden of ['privateKey', 'secretKey', 'seed phrase', 'mnemonic']) {
      assert.ok(!text.toLowerCase().includes(forbidden.toLowerCase()), `${f} must not contain ${forbidden}`);
    }
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { planDistribution, mintReady, BATCH_SIZE } from '../scripts/distribute-member-rewards.js';
import { MINT_NOT_ISSUED } from '../scripts/lib/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('distribution is refused before the mint exists', () => {
  assert.equal(mintReady(MINT_NOT_ISSUED).ready, false);
  assert.equal(mintReady('').ready, false);
  assert.equal(mintReady('not-a-mint').ready, false);
});

test('a valid mint is accepted', () => {
  assert.equal(mintReady('So11111111111111111111111111111111111111112').ready, true);
});

test('plan pays every eligible wallet exactly once, batched', () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((w) => ({ wallet: w, eligible: true }));
  const plan = planDistribution(rows, { paid: {} });
  assert.equal(plan.totalRecipients, 9);
  assert.equal(plan.totalTokens, 90_000);
  assert.equal(plan.batches.length, Math.ceil(9 / BATCH_SIZE));
});

test('resume is safe: already-paid wallets are never paid twice', () => {
  const rows = ['A', 'B', 'C'].map((w) => ({ wallet: w, eligible: true }));
  const ledger = { paid: { A: { tx_signature: 'sig-A' } } };
  const plan = planDistribution(rows, ledger);
  assert.equal(plan.alreadyPaid.length, 1);
  assert.equal(plan.totalRecipients, 2);
  assert.ok(!plan.recipients.some((r) => r.wallet === 'A'));
});

test('the distribution tool holds no keys and never broadcasts', () => {
  const src = readFileSync(resolve(__dirname, '../scripts/distribute-member-rewards.js'), 'utf8');
  for (const forbidden of ['Keypair', 'secretKey', 'privateKey', 'sendTransaction', 'sendRawTransaction', 'signTransaction']) {
    assert.ok(!src.includes(forbidden), `distribution tool must not reference ${forbidden}`);
  }
});

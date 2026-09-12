import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions, summarize } from '../scripts/lib/member-snapshot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE = resolve(__dirname, 'fixtures/member-submissions.sample.csv');

function load() {
  const { rows } = parseCsv(readFileSync(SAMPLE, 'utf8'));
  return validateSubmissions(rows);
}

test('sample snapshot reconciles to the expected totals', () => {
  const { totals } = load();
  assert.equal(totals.submissions, 8);
  assert.equal(totals.valid_wallets, 7);
  assert.equal(totals.invalid_wallets, 1);
  assert.equal(totals.duplicate_wallets, 2);
  assert.equal(totals.duplicate_usernames, 1);
  assert.equal(totals.eligible, 3);
  assert.equal(totals.member_tokens_total, 30_000);
});

test('every eligible member gets exactly 10,000 DBD, ineligible get 0', () => {
  const { rows } = load();
  for (const r of rows) {
    assert.equal(r.reward_tokens, r.eligible ? 10_000 : 0);
  }
});

test('invalid wallet is rejected', () => {
  const { rows } = load();
  const dave = rows.find((r) => r.telegram_username === 'dave');
  assert.equal(dave.wallet_valid, false);
  assert.equal(dave.eligible, false);
});

test('late submission is rejected (deadline enforced)', () => {
  const { rows } = load();
  const erin = rows.find((r) => r.telegram_username === 'erin');
  assert.equal(erin.submitted_before_deadline, false);
  assert.equal(erin.eligible, false);
});

test('duplicate username and duplicate wallet are rejected', () => {
  const { rows } = load();
  const dupUser = rows.filter((r) => r.duplicate_username);
  const dupWallet = rows.filter((r) => r.duplicate_wallet);
  assert.equal(dupUser.length, 1);
  assert.equal(dupWallet.length, 2);
  for (const r of [...dupUser, ...dupWallet]) assert.equal(r.eligible, false);
});

test('missing username is rejected', () => {
  const { rows } = load();
  const blank = rows.find((r) => r.telegram_username === '');
  assert.equal(blank.eligible, false);
});

test('summarize is consistent with eligible count', () => {
  const { rows } = load();
  const t = summarize(rows);
  assert.equal(t.eligible * 10_000, t.member_tokens_total);
});

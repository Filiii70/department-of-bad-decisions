import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_SUPPLY,
  FOUNDER_TOKENS,
  MODERATOR_TOKENS_EACH,
  MEMBER_REWARD_TOKENS,
  MEMBER_DEADLINE_UTC,
  LAUNCH_UTC,
  MODERATOR_LOCK_DAYS,
  computeObligations,
} from '../scripts/lib/launch-obligations.js';

test('locked constants match the final agreement', () => {
  assert.equal(TOTAL_SUPPLY, 1_000_000_000);
  assert.equal(FOUNDER_TOKENS, 10_000_000); // 1%
  assert.equal(MODERATOR_TOKENS_EACH, 25_000_000); // 2.5%
  assert.equal(MEMBER_REWARD_TOKENS, 10_000);
  assert.equal(MODERATOR_LOCK_DAYS, 7);
  assert.equal(MEMBER_DEADLINE_UTC, '2026-09-15T12:00:00Z'); // 14:00 CEST
  assert.equal(LAUNCH_UTC, '2026-09-15T18:00:00Z'); // 20:00 CEST
});

test('obligations for 415 eligible members = 64.15M = 6.415%', () => {
  const o = computeObligations(415);
  assert.equal(o.founder, 10_000_000);
  assert.equal(o.moderators.zafir, 25_000_000);
  assert.equal(o.moderators.emmanuel, 25_000_000);
  assert.equal(o.moderators.total, 50_000_000);
  assert.equal(o.members, 4_150_000);
  assert.equal(o.total, 64_150_000);
  assert.equal(Number(o.percentOfSupply.toFixed(3)), 6.415);
});

test('obligations for 0 members = only founder + moderators (60M)', () => {
  const o = computeObligations(0);
  assert.equal(o.members, 0);
  assert.equal(o.total, 60_000_000);
});

test('no moderator amount other than exactly 25M', () => {
  const o = computeObligations(100);
  assert.equal(o.moderators.zafir, MODERATOR_TOKENS_EACH);
  assert.equal(o.moderators.emmanuel, MODERATOR_TOKENS_EACH);
});

test('DBD Dev Privat is explicitly excluded from the launch obligation', () => {
  const o = computeObligations(415);
  assert.ok(o.excluded.join(' ').includes('Dev Privat'));
});

test('invalid eligible counts are rejected', () => {
  assert.throws(() => computeObligations(-1));
  assert.throws(() => computeObligations(1.5));
  assert.throws(() => computeObligations('x'));
});

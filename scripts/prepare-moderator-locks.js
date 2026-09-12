// Prepare the 7-day on-chain moderator locks. PREPARATION ONLY.
//   - reads launch/moderators.json (wallets are filled by the human, never invented)
//   - validates each wallet and the exact 25,000,000 DBD amount
//   - computes lock start (launch) and end (launch + 7 days)
//   - STOPS with a blocker if a wallet is missing/invalid or the lock mechanism
//     has not been verified (docs/MODERATOR-LOCK-VERIFICATION.md)
//   - never signs, never creates a lock
//
// Usage: node scripts/prepare-moderator-locks.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { isValidSolanaAddress } from './lib/solana.js';
import { MODERATOR_TOKENS_EACH, MODERATOR_LOCK_DAYS, LAUNCH_UTC } from './lib/launch-obligations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

export function computeLockWindow(launchUtc = LAUNCH_UTC, days = MODERATOR_LOCK_DAYS) {
  const start = new Date(launchUtc);
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return { lock_start: start.toISOString(), lock_end: end.toISOString(), days };
}

// Pure: validate a moderators.json document. Returns { ok, blockers, prepared }.
export function validateModerators(doc) {
  const blockers = [];
  const mods = Array.isArray(doc?.moderators) ? doc.moderators : [];
  if (mods.length !== 2) blockers.push(`expected exactly 2 moderators, found ${mods.length}`);

  const win = computeLockWindow();
  const prepared = mods.map((m) => {
    const problems = [];
    if (!m.wallet) problems.push('missing wallet');
    else if (!isValidSolanaAddress(m.wallet)) problems.push('invalid Solana wallet');
    if (Number(m.allocation_tokens) !== MODERATOR_TOKENS_EACH) {
      problems.push(`allocation_tokens must be exactly ${MODERATOR_TOKENS_EACH}`);
    }
    problems.forEach((p) => blockers.push(`${m.name || 'moderator'}: ${p}`));
    return {
      ...m,
      allocation_tokens: MODERATOR_TOKENS_EACH,
      allocation_percent: 2.5,
      lock_start: win.lock_start,
      lock_end: win.lock_end,
      lock_days: win.days,
      status: problems.length === 0 ? 'READY_TO_LOCK' : 'BLOCKED',
      problems,
    };
  });

  return { ok: blockers.length === 0, blockers, prepared, window: win };
}

function main() {
  const modPath = resolve(ROOT, 'launch/moderators.json');
  const verificationPath = resolve(ROOT, 'docs/MODERATOR-LOCK-VERIFICATION.md');

  console.log('DBD MODERATOR 7-DAY LOCK PREPARATION  (PREPARATION ONLY, NO LOCK CREATED)');
  console.log('='.repeat(60));

  if (!existsSync(verificationPath)) {
    console.error('BLOCKER: docs/MODERATOR-LOCK-VERIFICATION.md is missing. Verify the lock mechanism first.');
    process.exit(1);
  }
  if (!existsSync(modPath)) {
    console.error(`BLOCKER: ${modPath} not found.`);
    process.exit(1);
  }

  const doc = JSON.parse(readFileSync(modPath, 'utf8'));
  const res = validateModerators(doc);

  for (const m of res.prepared) {
    console.log(`  ${m.name.padEnd(16)} ${(m.allocation_tokens).toLocaleString('en-US')} DBD  ${m.status}`);
    console.log(`    wallet: ${m.wallet || '(missing)'}`);
    console.log(`    lock:   ${m.lock_start}  ->  ${m.lock_end}  (${m.lock_days} days)`);
    if (m.problems.length) console.log(`    problems: ${m.problems.join('; ')}`);
  }
  console.log('');

  mkdirSync(resolve(ROOT, 'launch/generated'), { recursive: true });
  writeFileSync(
    resolve(ROOT, 'launch/generated/MODERATOR-LOCK-PLAN.md'),
    renderPlan(res)
  );

  if (!res.ok) {
    console.error('BLOCKERS (fix before launch):');
    for (const b of res.blockers) console.error(`  - ${b}`);
    process.exit(1);
  }
  console.log('PASS: both moderator locks are ready to be created by the human (dry-run only here).');
  process.exit(0);
}

function renderPlan(res) {
  const lines = ['# DBD Moderator Lock Plan', '', `Lock window: ${res.window.lock_start} -> ${res.window.lock_end} (${res.window.days} days)`, ''];
  for (const m of res.prepared) {
    lines.push(`## ${m.name}`);
    lines.push(`- Allocation: ${m.allocation_tokens.toLocaleString('en-US')} DBD (2.5%)`);
    lines.push(`- Wallet: ${m.wallet || '(missing)'}`);
    lines.push(`- Status: ${m.status}`);
    if (m.problems?.length) lines.push(`- Problems: ${m.problems.join('; ')}`);
    lines.push('');
  }
  lines.push(res.ok ? 'All moderators ready to lock. Human creates the on-chain locks and records tx + lock address.' : 'BLOCKED: resolve problems above before launch.');
  lines.push('');
  return lines.join('\n');
}

if (process.argv[1]?.endsWith('prepare-moderator-locks.js')) {
  main();
}

// Reconcile the launch: required obligations vs. what has actually happened.
// CALCULATION ONLY. Reads the snapshot, the distribution ledger, moderators.json
// and config, and reports whether everything reconciles exactly.
//
// Before launch this correctly shows 0 distributed / 0 locked and status PRE-LAUNCH.
//
// Usage: node scripts/reconcile-launch.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions } from './lib/member-snapshot.js';
import { computeObligations, MODERATOR_TOKENS_EACH, MEMBER_REWARD_TOKENS } from './lib/launch-obligations.js';
import { loadConfig, MINT_NOT_ISSUED } from './lib/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Pure reconciliation core.
export function reconcile({ eligibleCount, ledger = { paid: {} }, moderators = { moderators: [] }, mint }) {
  const obligations = computeObligations(eligibleCount);
  const paidWallets = Object.values(ledger.paid || {}).filter((p) => p && p.tx_signature);
  const membersDistributed = paidWallets.length * MEMBER_REWARD_TOKENS;
  const mods = moderators.moderators || [];
  const modsLocked = mods
    .filter((m) => m.status === 'LOCKED' && m.lock_address)
    .reduce((sum, m) => sum + Number(m.allocation_tokens || 0), 0);

  const memberDelta = obligations.members - membersDistributed;
  const modDelta = obligations.moderators.total - modsLocked;
  const preLaunch = !mint || mint === MINT_NOT_ISSUED;

  return {
    preLaunch,
    obligations,
    distributed: { members: membersDistributed, memberWallets: paidWallets.length },
    locked: { moderators: modsLocked },
    deltas: { members: memberDelta, moderators: modDelta },
    reconciled: memberDelta === 0 && modDelta === 0,
  };
}

function eligibleFromSubmissions() {
  const inputPath = resolve(ROOT, 'launch/member-submissions.csv');
  if (!existsSync(inputPath)) return 0;
  const { rows } = parseCsv(readFileSync(inputPath, 'utf8'));
  return validateSubmissions(rows).totals.eligible;
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function main() {
  const cfg = loadConfig();
  const eligibleCount = eligibleFromSubmissions();
  const ledger = loadJson(resolve(ROOT, 'launch/generated/member-distribution-ledger.json'), { paid: {} });
  const moderators = loadJson(resolve(ROOT, 'launch/moderators.json'), { moderators: [] });

  const r = reconcile({ eligibleCount, ledger, moderators, mint: cfg.official_mint });

  const md = [
    '# DBD Launch Reconciliation',
    '',
    `Status: ${r.preLaunch ? 'PRE-LAUNCH (nothing distributed yet)' : 'LIVE'}`,
    `Official mint: ${cfg.official_mint}`,
    '',
    '## Obligations (locked economics)',
    `- Founder: ${r.obligations.founder.toLocaleString('en-US')} DBD`,
    `- Moderators: ${r.obligations.moderators.total.toLocaleString('en-US')} DBD (2x ${MODERATOR_TOKENS_EACH.toLocaleString('en-US')})`,
    `- Members (${eligibleCount} eligible): ${r.obligations.members.toLocaleString('en-US')} DBD`,
    `- TOTAL: ${r.obligations.total.toLocaleString('en-US')} DBD (${r.obligations.percentOfSupply.toFixed(4)}%)`,
    '',
    '## Actual',
    `- Member tokens distributed: ${r.distributed.members.toLocaleString('en-US')} DBD to ${r.distributed.memberWallets} wallets`,
    `- Moderator tokens locked: ${r.locked.moderators.toLocaleString('en-US')} DBD`,
    '',
    '## Deltas (must be 0 after launch)',
    `- Members outstanding: ${r.deltas.members.toLocaleString('en-US')} DBD`,
    `- Moderators outstanding: ${r.deltas.moderators.toLocaleString('en-US')} DBD`,
    '',
    `Reconciled: ${r.reconciled ? 'YES' : 'NO (expected before launch)'}`,
    '',
  ].join('\n');

  console.log(md);
  mkdirSync(resolve(ROOT, 'launch/generated'), { recursive: true });
  writeFileSync(resolve(ROOT, 'launch/generated/LAUNCH-RECONCILIATION.md'), md);
  process.exit(0);
}

if (process.argv[1]?.endsWith('reconcile-launch.js')) {
  main();
}

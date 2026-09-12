// Prepare the member reward distribution. SAFE BY DESIGN.
//   - default mode is --dry-run
//   - refuses to prepare/execute while the official mint is NOT_YET_ISSUED
//   - re-validates every recipient wallet
//   - plans safe batches
//   - resume-safe: never pays a wallet already recorded in the ledger
//   - holds NO private keys and NEVER broadcasts a transaction
//
// On-chain execution is performed by the human in their own signing tool. This
// script only produces the plan and the reconciliation ledger scaffold.
//
// Usage:
//   node scripts/distribute-member-rewards.js                 (dry-run)
//   node scripts/distribute-member-rewards.js --prepare
//   node scripts/distribute-member-rewards.js --execute

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions } from './lib/member-snapshot.js';
import { loadConfig, MINT_NOT_ISSUED } from './lib/config.js';
import { isValidSolanaAddress } from './lib/solana.js';
import { MEMBER_REWARD_TOKENS } from './lib/launch-obligations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
export const BATCH_SIZE = 8; // conservative: leaves room for ATA creation per tx

function parseArgs(argv) {
  const a = { mode: 'dry-run' };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--dry-run') a.mode = 'dry-run';
    else if (t === '--prepare') a.mode = 'prepare';
    else if (t === '--execute') a.mode = 'execute';
    else if (t.startsWith('--')) { a[t.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

// Pure: decide who still needs paying and how to batch them.
export function planDistribution(eligibleRows, ledger = { paid: {} }, batchSize = BATCH_SIZE) {
  const paid = ledger.paid || {};
  const recipients = [];
  const alreadyPaid = [];
  for (const r of eligibleRows) {
    if (paid[r.wallet] && paid[r.wallet].tx_signature) alreadyPaid.push(r);
    else recipients.push(r);
  }
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }
  return {
    recipients,
    alreadyPaid,
    batches,
    totalRecipients: recipients.length,
    totalTokens: recipients.length * MEMBER_REWARD_TOKENS,
  };
}

// Pure: is the mint ready for real distribution?
export function mintReady(mint) {
  if (!mint || mint === MINT_NOT_ISSUED) return { ready: false, reason: 'official mint is NOT_YET_ISSUED' };
  if (!isValidSolanaAddress(mint)) return { ready: false, reason: `official mint is not a valid Solana address: ${mint}` };
  return { ready: true };
}

function loadLedger(path) {
  if (!existsSync(path)) return { paid: {} };
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return { paid: {} }; }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = loadConfig();
  const inputPath = resolve(ROOT, args.input || 'launch/member-submissions.csv');
  const ledgerPath = resolve(ROOT, 'launch/generated/member-distribution-ledger.json');

  console.log(`DBD MEMBER DISTRIBUTION  [mode: ${args.mode}]`);
  console.log('='.repeat(52));

  const mr = mintReady(cfg.official_mint);
  if (!mr.ready && (args.mode === 'prepare' || args.mode === 'execute')) {
    console.error(`REFUSED: ${mr.reason}. Cannot ${args.mode} distribution before the token exists.`);
    process.exit(1);
  }

  if (!existsSync(inputPath)) {
    console.error(`No submissions file at ${inputPath}. Nothing to plan.`);
    process.exit(1);
  }
  const { rows } = parseCsv(readFileSync(inputPath, 'utf8'));
  const { rows: validated } = validateSubmissions(rows);
  const eligible = validated.filter((r) => r.eligible);

  const ledger = loadLedger(ledgerPath);
  const plan = planDistribution(eligible, ledger);

  console.log(`  Official mint           ${cfg.official_mint}${mr.ready ? '' : '  (NOT READY)'}`);
  console.log(`  Eligible members        ${eligible.length}`);
  console.log(`  Already paid (ledger)   ${plan.alreadyPaid.length}`);
  console.log(`  To pay now              ${plan.totalRecipients}`);
  console.log(`  Tokens to send          ${plan.totalTokens.toLocaleString('en-US')} DBD (${MEMBER_REWARD_TOKENS.toLocaleString('en-US')} each)`);
  console.log(`  Batches (${BATCH_SIZE}/tx)          ${plan.batches.length}`);
  console.log('');

  if (args.mode === 'execute') {
    console.log('  EXECUTE: this repository holds NO private keys and will NOT broadcast.');
    console.log('  On-chain sending is done by the human in their own signing tool, wallet-approved,');
    console.log('  using the batch plan above and the ledger for resume safety. Nothing was sent.');
  } else {
    console.log(`  ${args.mode === 'dry-run' ? 'DRY-RUN' : 'PREPARE'}: no transaction attempted. No wallet touched.`);
  }

  // Always write a human-readable plan; never write the ledger from here.
  mkdirSync(resolve(ROOT, 'launch/generated'), { recursive: true });
  const md = [
    '# DBD Member Distribution Plan',
    '',
    `Mode: ${args.mode}`,
    `Official mint: ${cfg.official_mint}${mr.ready ? '' : ' (NOT READY)'}`,
    `Eligible members: ${eligible.length}`,
    `Already paid: ${plan.alreadyPaid.length}`,
    `To pay now: ${plan.totalRecipients}`,
    `Tokens to send: ${plan.totalTokens.toLocaleString('en-US')} DBD`,
    `Batches (${BATCH_SIZE}/tx): ${plan.batches.length}`,
    `Reward each: ${MEMBER_REWARD_TOKENS.toLocaleString('en-US')} DBD`,
    '',
    'Resume: wallets present in launch/generated/member-distribution-ledger.json with a tx_signature are skipped.',
    'This tool never signs or broadcasts; the human executes with their own wallet.',
    '',
  ].join('\n');
  writeFileSync(resolve(ROOT, 'launch/generated/MEMBER-DISTRIBUTION-PLAN.md'), md);
  process.exit(0);
}

if (process.argv[1]?.endsWith('distribute-member-rewards.js')) {
  main();
}

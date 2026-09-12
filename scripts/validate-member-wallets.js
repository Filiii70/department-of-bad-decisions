// Validate pre-launch member submissions and produce the canonical snapshot.
// CALCULATION ONLY. Reads a submissions CSV, rejects invalid/duplicate/late
// entries, writes launch/member-snapshot.csv and a human-readable report.
//
// Usage:
//   node scripts/validate-member-wallets.js
//   node scripts/validate-member-wallets.js --input launch/member-submissions.csv
//   node scripts/validate-member-wallets.js --input <file> --no-write   (report only)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions, rowsToSnapshotCsv } from './lib/member-snapshot.js';
import { MEMBER_DEADLINE_UTC, MEMBER_REWARD_TOKENS } from './lib/launch-obligations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--no-write') a.noWrite = true;
    else if (t.startsWith('--')) { a[t.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

export function runValidation(inputPath) {
  if (!existsSync(inputPath)) {
    return { ok: false, fatal: `Input file not found: ${inputPath}` };
  }
  const text = readFileSync(inputPath, 'utf8');
  const { rows: raw } = parseCsv(text);
  if (raw.length === 0) {
    return { ok: false, fatal: 'No submissions found in input file.' };
  }
  const { rows, totals } = validateSubmissions(raw, { deadlineUtc: MEMBER_DEADLINE_UTC });

  // Internal consistency guard: eligible count must reconcile with the token total.
  const consistent = totals.eligible * MEMBER_REWARD_TOKENS === totals.member_tokens_total;
  return { ok: consistent, rows, totals, inputPath };
}

function report(res) {
  const t = res.totals;
  const lines = [];
  lines.push('# DBD Member Snapshot Report');
  lines.push('');
  lines.push(`Deadline (UTC): ${MEMBER_DEADLINE_UTC}`);
  lines.push(`Input: ${res.inputPath}`);
  lines.push('');
  lines.push('## Totals');
  lines.push(`- Submissions: ${t.submissions}`);
  lines.push(`- Valid wallets: ${t.valid_wallets}`);
  lines.push(`- Invalid wallets: ${t.invalid_wallets}`);
  lines.push(`- Duplicate wallets: ${t.duplicate_wallets}`);
  lines.push(`- Duplicate usernames: ${t.duplicate_usernames}`);
  lines.push(`- Eligible members: ${t.eligible}`);
  lines.push(`- Member tokens required: ${t.member_tokens_total.toLocaleString('en-US')} DBD (${MEMBER_REWARD_TOKENS.toLocaleString('en-US')} each)`);
  lines.push(`- Percent of supply: ${t.percent_of_supply.toFixed(4)}%`);
  lines.push('');
  const rejected = res.rows.filter((r) => !r.eligible);
  lines.push(`## Rejected / ineligible (${rejected.length})`);
  if (rejected.length === 0) lines.push('- none');
  for (const r of rejected) {
    lines.push(`- ${r.telegram_username || '(no username)'} | ${r.wallet || '(no wallet)'} | ${r.notes}`);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(ROOT, args.input || 'launch/member-submissions.csv');
  const res = runValidation(inputPath);

  if (res.fatal) {
    console.error(`FAIL: ${res.fatal}`);
    process.exit(1);
  }

  const md = report(res);
  console.log(md);

  if (!args.noWrite) {
    mkdirSync(resolve(ROOT, 'launch/generated'), { recursive: true });
    writeFileSync(resolve(ROOT, 'launch/member-snapshot.csv'), rowsToSnapshotCsv(res.rows));
    writeFileSync(resolve(ROOT, 'launch/generated/MEMBER-SNAPSHOT-REPORT.md'), md + '\n');
    console.log('\nWrote launch/member-snapshot.csv and launch/generated/MEMBER-SNAPSHOT-REPORT.md');
  }

  console.log(`\n${res.ok ? 'PASS' : 'FAIL'} (${res.totals.eligible} eligible, ${res.totals.member_tokens_total.toLocaleString('en-US')} DBD)`);
  process.exit(res.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-member-wallets.js')) {
  main();
}

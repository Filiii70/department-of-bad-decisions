// Compute the FINAL launch token obligation from the validated member snapshot.
// CALCULATION ONLY. Locked constants live in scripts/lib/launch-obligations.js.
//
// Eligible member count is taken (in order of preference) from:
//   --members <n>            explicit count
//   --input <submissions.csv> validated live
//   launch/member-submissions.csv (default) if present
//
// Usage:
//   node scripts/calculate-launch-obligations.js --members 415
//   node scripts/calculate-launch-obligations.js --input launch/member-submissions.csv

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions } from './lib/member-snapshot.js';
import { computeObligations } from './lib/launch-obligations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { a[t.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

export function resolveEligibleCount(args) {
  if (args.members !== undefined) {
    const n = Number(args.members);
    if (!Number.isInteger(n) || n < 0) throw new Error('--members must be a non-negative integer');
    return { count: n, source: `--members ${n}` };
  }
  const inputPath = resolve(ROOT, args.input || 'launch/member-submissions.csv');
  if (existsSync(inputPath)) {
    const { rows } = parseCsv(readFileSync(inputPath, 'utf8'));
    const { totals } = validateSubmissions(rows);
    return { count: totals.eligible, source: `validated snapshot from ${inputPath}` };
  }
  return { count: null, source: 'none' };
}

function fmt(n) { return n.toLocaleString('en-US'); }

function main() {
  const args = parseArgs(process.argv.slice(2));
  let count;
  try {
    const r = resolveEligibleCount(args);
    if (r.count === null) {
      console.error('FAIL: no eligible member count. Provide --members <n> or a submissions file.');
      console.error('Note: before the deadline this is unknown by design. Use the final snapshot.');
      process.exit(1);
    }
    count = r.count;
    console.log(`Eligible member source: ${r.source}\n`);
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    process.exit(1);
  }

  const o = computeObligations(count);
  console.log('DBD FINAL LAUNCH OBLIGATION  (LOCKED ECONOMICS)');
  console.log('='.repeat(52));
  console.log(`  Founder (1%)             ${fmt(o.founder)} DBD`);
  console.log(`  Zafir (2.5%)             ${fmt(o.moderators.zafir)} DBD`);
  console.log(`  Emmanuel Crypt (2.5%)    ${fmt(o.moderators.emmanuel)} DBD`);
  console.log(`  Moderators total (5%)    ${fmt(o.moderators.total)} DBD`);
  console.log(`  Members (${count} x 10,000)  ${fmt(o.members)} DBD`);
  console.log('  ' + '-'.repeat(48));
  console.log(`  TOTAL AT LAUNCH          ${fmt(o.total)} DBD`);
  console.log(`  = ${o.percentOfSupply.toFixed(4)}% of 1,000,000,000 supply`);
  console.log('');
  console.log('  Excluded (NOT part of the launch obligation):');
  for (const x of o.excluded) console.log(`   - ${x}`);
  console.log('');
}

if (process.argv[1]?.endsWith('calculate-launch-obligations.js')) {
  main();
}

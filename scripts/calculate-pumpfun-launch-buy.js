// Estimate the SOL needed for the create+buy of the FULL launch obligation.
// CALCULATION ONLY. Never creates a token, never buys, never signs.
//
// The token amount comes from calculate-launch-obligations (member snapshot +
// locked constants). The SOL figure is an ESTIMATE using community curve
// constants; the LIVE quote on the pump.fun create screen is the ground truth
// you approve against on launch day.
//
// Usage:
//   node scripts/calculate-pumpfun-launch-buy.js --members 415
//   node scripts/calculate-pumpfun-launch-buy.js --tokens 64150000
//   node scripts/calculate-pumpfun-launch-buy.js --members 415 --buffer 20

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { computeObligations } from './lib/launch-obligations.js';
import { quoteBuy, roundSol, CURVE_PARAMS } from './lib/pumpfun-curve.js';
import { resolveEligibleCount } from './calculate-launch-obligations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { a[t.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let tokens;
  let source;

  if (args.tokens !== undefined) {
    tokens = Number(args.tokens);
    source = `--tokens ${args.tokens}`;
  } else {
    const r = resolveEligibleCount(args);
    if (r.count === null) {
      console.error('FAIL: provide --tokens <n>, --members <n>, or a submissions file.');
      process.exit(1);
    }
    tokens = computeObligations(r.count).total;
    source = `launch obligation for ${r.count} eligible members (${r.source})`;
  }

  const bufferPct = args.buffer !== undefined ? Number(args.buffer) : 15;
  const q = quoteBuy(tokens, { bufferPct });

  console.log('DBD PUMP.FUN CREATE+BUY ESTIMATE  (CALCULATION ONLY, NO BUY)');
  console.log('='.repeat(60));
  console.log(`  Token amount            ${tokens.toLocaleString('en-US')} DBD`);
  console.log(`  Source                  ${source}`);
  if (!q.ok) {
    console.log(`  Result                  ${q.error}`);
    process.exit(1);
  }
  console.log(`  Percent of supply       ${q.percentOfSupply.toFixed(4)}%`);
  console.log(`  Raw curve SOL           ${roundSol(q.rawSol)} SOL`);
  console.log(`  Pump.fun fee (1.25%)    ${roundSol(q.feeSol)} SOL`);
  console.log(`  Total SOL (raw+fee)     ${roundSol(q.totalSol)} SOL`);
  console.log(`  With ${q.bufferPct}% buffer         ${roundSol(q.withBuffer)} SOL  <- recommended in DBD Creator`);
  console.log(`  Note                    excludes ATA rent (~0.002 SOL per new member account) and price movement from others buying first.`);
  console.log(`  Params source           ${q.paramsSource}`);
  console.log(`  Params as-of            ${q.paramsAsOf}`);
  console.log('');
  console.log('  GROUND TRUTH: the live quote on the pump.fun create screen. Do not sign if it differs materially.');
  console.log('');
}

if (process.argv[1]?.endsWith('calculate-pumpfun-launch-buy.js')) {
  main();
}

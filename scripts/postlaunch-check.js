#!/usr/bin/env node
// DBD post-launch verification. Read-only. Requires network access to confirm
// the mint exists on Solana. Fails safe: network problems are reported as
// UNAVAILABLE, never fabricated. Exits non-zero on any CRITICAL failure.

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, isPlaceholder, MINT_NOT_ISSUED } from './lib/config.js';
import { isValidSolanaAddress, getMintAccount, getTokenSupply, getRpcUrl } from './lib/solana.js';
import { explorerTokenUrl, launchPlatformUrl, explorerAccountUrl } from './lib/links.js';
import { leader, heading, UNAVAILABLE } from './lib/report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const checks = [];
function record(label, state, detail) {
  // state: 'PASS' | 'FAIL' | 'UNAVAILABLE'
  checks.push({ label, state, detail });
}

async function run() {
  const cfg = loadConfig();

  console.log(heading('DBD POST-LAUNCH VERIFICATION'));
  console.log('RPC endpoint: ' + getRpcUrl());
  console.log('');

  // Precondition: mint must be configured and valid.
  if (cfg.official_mint === MINT_NOT_ISSUED || isPlaceholder(cfg.official_mint) || !cfg.official_mint) {
    console.error('official_mint is not set. Configure the real mint after launch, then rerun.');
    process.exit(2);
  }

  const mint = cfg.official_mint;

  // 1. Mint address format
  const validFmt = isValidSolanaAddress(mint);
  record('Mint format valid', validFmt ? 'PASS' : 'FAIL', mint);

  // 2. Launch status live
  record('Status is live', cfg.launch_status === 'live' ? 'PASS' : 'FAIL', cfg.launch_status);

  // 3. Mint exists on chain
  if (validFmt) {
    const acc = await getMintAccount(mint);
    if (!acc.ok) {
      record('Mint exists on Solana', UNAVAILABLE, acc.error);
    } else {
      const isMint = acc.type === 'mint' || acc.parsed !== null;
      record('Mint exists on Solana', isMint ? 'PASS' : 'FAIL',
        `owner ${acc.owner}${acc.type ? ', type ' + acc.type : ''}`);
    }

    // 4. Token supply / metadata accessible
    const sup = await getTokenSupply(mint);
    if (!sup.ok) record('Token supply readable', UNAVAILABLE, sup.error);
    else record('Token supply readable', 'PASS', `${sup.uiAmountString} (decimals ${sup.decimals})`);
  } else {
    record('Mint exists on Solana', 'FAIL', 'invalid format, not queried');
  }

  // 5. Configured mint matches the built website's displayed mint
  const distConfig = join(ROOT, 'site', 'dist', 'config.json');
  if (existsSync(distConfig)) {
    try {
      const dc = JSON.parse(readFileSync(distConfig, 'utf8'));
      const match = dc.official_mint === mint && dc.launch_status === 'live';
      record('Website mint matches config', match ? 'PASS' : 'FAIL',
        match ? '' : `site shows mint=${dc.official_mint} status=${dc.launch_status} (rebuild the site)`);
    } catch (e) {
      record('Website mint matches config', 'FAIL', 'could not read built site config: ' + e.message);
    }
  } else {
    record('Website mint matches config', UNAVAILABLE, 'site not built yet (run npm run build)');
  }

  // 6. Explorer + launch platform URLs resolve to correct shapes
  const exUrl = explorerTokenUrl(cfg.explorer_base_url, mint);
  record('Explorer link generated', exUrl ? 'PASS' : 'FAIL', exUrl || 'could not build');

  const platUrl = launchPlatformUrl(cfg.launch_platform, mint);
  record('Launch platform link', platUrl ? 'PASS' : UNAVAILABLE,
    platUrl || `unknown platform "${cfg.launch_platform}", set a known one`);

  // 7. Creator + treasury wallets still valid and displayed
  const creatorOk = isValidSolanaAddress(cfg.creator_wallet);
  const treasuryOk = isValidSolanaAddress(cfg.treasury_wallet);
  record('Creator wallet valid', creatorOk ? 'PASS' : 'FAIL',
    creatorOk ? explorerAccountUrl(cfg.explorer_base_url, cfg.creator_wallet) : cfg.creator_wallet);
  record('Treasury wallet valid', treasuryOk ? 'PASS' : 'FAIL',
    treasuryOk ? explorerAccountUrl(cfg.explorer_base_url, cfg.treasury_wallet) : cfg.treasury_wallet);

  print();
}

function print() {
  console.log('');
  for (const c of checks) {
    console.log(leader(c.label, c.state, 30));
  }

  const details = checks.filter((c) => c.detail);
  if (details.length) {
    console.log('\nDetails:');
    for (const c of details) console.log(`  ${c.label}: ${c.detail}`);
  }

  const fails = checks.filter((c) => c.state === 'FAIL');
  const unavailable = checks.filter((c) => c.state === UNAVAILABLE);

  let status;
  if (fails.length) status = 'LAUNCH VERIFICATION FAILED';
  else if (unavailable.length) status = 'LAUNCH VERIFICATION INCOMPLETE (some data UNAVAILABLE, rerun)';
  else status = 'LAUNCH VERIFIED';

  console.log('\nSTATUS: ' + status);
  process.exit(fails.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Unexpected error: ' + err.message);
  process.exit(2);
});

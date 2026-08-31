#!/usr/bin/env node
// DBD monitor. Read-only. Produces both human-readable CLI output and a JSON
// file the site could later consume. Never fabricates data: anything that
// cannot be retrieved is reported as UNAVAILABLE.
//
// Output JSON: monitoring/output/monitor.json (git-ignored).

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, isPlaceholder, MINT_NOT_ISSUED } from '../scripts/lib/config.js';
import {
  getTokenSupply, getTokenLargestAccounts, getSolBalance,
  isValidSolanaAddress, getRpcUrl,
} from '../scripts/lib/solana.js';
import { leader, heading, UNAVAILABLE, pct } from '../scripts/lib/report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(__dirname, 'output');

// Human-set timestamp captured at run time by a real invocation.
const capturedAt = new Date().toISOString();

async function walletBalance(label, address) {
  if (!address || isPlaceholder(address) || !isValidSolanaAddress(address)) {
    return { label, address: address || null, sol: UNAVAILABLE, note: 'not configured or invalid' };
  }
  const r = await getSolBalance(address);
  if (!r.ok) return { label, address, sol: UNAVAILABLE, note: r.error };
  return { label, address, sol: r.sol };
}

async function main() {
  const cfg = loadConfig();
  const out = {
    captured_at: capturedAt,
    rpc: getRpcUrl(),
    launch_status: cfg.launch_status,
    mint: null,
    supply: UNAVAILABLE,
    holders: UNAVAILABLE,
    concentration: { top1: UNAVAILABLE, top5: UNAVAILABLE, top10: UNAVAILABLE },
    wallets: {},
    large_transfers: UNAVAILABLE,
    notes: [],
  };

  const mintReady = cfg.official_mint
    && cfg.official_mint !== MINT_NOT_ISSUED
    && !isPlaceholder(cfg.official_mint)
    && isValidSolanaAddress(cfg.official_mint);

  if (mintReady) {
    out.mint = cfg.official_mint;

    const sup = await getTokenSupply(cfg.official_mint);
    let supplyUi = null;
    if (sup.ok) { out.supply = sup.uiAmountString; supplyUi = sup.uiAmount; }
    else out.notes.push('supply: ' + sup.error);

    const largest = await getTokenLargestAccounts(cfg.official_mint);
    if (largest.ok && supplyUi && supplyUi > 0) {
      const amts = largest.accounts.map((x) => x.uiAmount ?? 0);
      const top1 = amts[0] ?? 0;
      const top5 = amts.slice(0, 5).reduce((s, x) => s + x, 0);
      const top10 = amts.slice(0, 10).reduce((s, x) => s + x, 0);
      out.concentration = {
        top1: pct(top1, supplyUi),
        top5: pct(top5, supplyUi),
        top10: pct(top10, supplyUi),
      };
    } else if (!largest.ok) {
      out.notes.push('holders/concentration: ' + largest.error);
    }
    // Holder count and full transfer history need an indexer; public RPC cannot
    // give an exact count cheaply. Report honestly rather than guessing.
    out.notes.push('holder count and large-transfer feed require an indexer; marked UNAVAILABLE on public RPC.');
  } else {
    out.notes.push('mint not issued yet; token metrics UNAVAILABLE.');
  }

  // Wallet SOL balances (work pre-launch too)
  out.wallets.creator = await walletBalance('creator', cfg.creator_wallet);
  out.wallets.treasury = await walletBalance('treasury', cfg.treasury_wallet);
  if (cfg.operational_wallet && !isPlaceholder(cfg.operational_wallet)) {
    out.wallets.operational = await walletBalance('operational', cfg.operational_wallet);
  }

  writeJson(out);
  printCli(out);
}

function writeJson(out) {
  mkdirSync(OUT_DIR, { recursive: true });
  const p = join(OUT_DIR, 'monitor.json');
  writeFileSync(p, JSON.stringify(out, null, 2));
  console.log('JSON written: ' + p);
}

function solStr(w) {
  if (!w) return UNAVAILABLE;
  return w.sol === UNAVAILABLE ? UNAVAILABLE : `${Number(w.sol).toFixed(4)} SOL`;
}

function printCli(out) {
  console.log(heading('DBD MONITOR'));
  console.log('Captured: ' + out.captured_at);
  console.log('Status:   ' + out.launch_status);
  console.log('Mint:     ' + (out.mint || 'NOT YET ISSUED'));
  console.log('');
  console.log(leader('Supply', out.supply, 18));
  console.log(leader('Holders', out.holders, 18));
  console.log(leader('Top holder', out.concentration.top1, 18));
  console.log(leader('Top 5', out.concentration.top5, 18));
  console.log(leader('Top 10', out.concentration.top10, 18));
  console.log(leader('Creator', solStr(out.wallets.creator), 18));
  console.log(leader('Treasury', solStr(out.wallets.treasury), 18));
  if (out.wallets.operational) console.log(leader('Operational', solStr(out.wallets.operational), 18));
  console.log(leader('Large transfers', out.large_transfers, 18));
  if (out.notes.length) {
    console.log('\nNotes:');
    for (const n of out.notes) console.log('  - ' + n);
  }
}

main().catch((e) => {
  console.error('Monitor error: ' + e.message);
  process.exit(1);
});

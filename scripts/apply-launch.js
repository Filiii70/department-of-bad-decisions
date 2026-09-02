/* apply-launch.js — deterministic post-creation updater.
 *
 * Run this ONCE, AFTER the human has created the token on Pump.fun and has the
 * real mint address. It performs the whole "go live" flip in one operation:
 *   - validates the Solana mint address (base58, 32 bytes)
 *   - sets official_mint, launch_status=live, launch_timestamp in the canonical config
 *   - bumps config_version and last_updated
 *   - appends a dated Bad Decision Register entry (site/src/data/register.json)
 *   - writes a launch log (launch/launch-log.json)
 *   - prints the Solscan mint link and the exact next commands
 *
 * It NEVER touches wallets, keys or seeds. It does not create a token.
 *
 * Safety: it is a DRY RUN by default and writes nothing without --confirm.
 * It refuses to run if the mint is invalid, a placeholder, or NOT_YET_ISSUED.
 *
 * Usage:
 *   node scripts/apply-launch.js --mint <MINT> --timestamp <ISO8601Z> \
 *        [--url <pumpfun_url>] [--sig <tx_signature>]           # dry run (preview)
 *   node scripts/apply-launch.js --mint <MINT> --timestamp <ISO8601Z> \
 *        [--url ...] [--sig ...] --confirm                       # actually write
 *
 * After a --confirm run:  npm run build   &&   npm run postlaunch-check
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidSolanaAddress } from './lib/solana.js';
import { MINT_NOT_ISSUED, PLACEHOLDER_MARKERS } from './lib/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'config', 'dbd.config.json');
const REGISTER_PATH = join(ROOT, 'site', 'src', 'data', 'register.json');
const LOG_PATH = join(ROOT, 'launch', 'launch-log.json');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--confirm') a.confirm = true;
    else if (t.startsWith('--')) { a[t.slice(2)] = argv[i + 1]; i += 1; }
  }
  return a;
}

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function main() {
  const args = parseArgs(process.argv.slice(2));
  const mint = args.mint;
  const timestamp = args.timestamp;
  const url = args.url || null;
  const sig = args.sig || null;

  if (!mint) fail('missing --mint <MINT_ADDRESS>');
  if (mint === MINT_NOT_ISSUED) fail('mint is still NOT_YET_ISSUED; supply the real mint address');
  if (PLACEHOLDER_MARKERS.some((m) => mint.includes(m))) fail('mint looks like a placeholder');
  if (!isValidSolanaAddress(mint)) fail('mint is not a valid base58 32-byte Solana address: ' + mint);
  if (!timestamp) fail('missing --timestamp <ISO8601 UTC, e.g. 2026-09-05T18:00:00Z>');
  if (!ISO_Z.test(timestamp)) fail('timestamp must be ISO 8601 UTC ending in Z, got: ' + timestamp);

  const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const explorer = String(cfg.explorer_base_url || 'https://solscan.io').replace(/\/$/, '');
  const solscan = explorer + '/token/' + mint;

  // Next config_version (bump patch)
  const parts = String(cfg.config_version || '1.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  parts[2] = (parts[2] || 0) + 1;
  const nextVersion = parts.join('.');
  const dateOnly = timestamp.slice(0, 10);

  // Register: next BD ref
  let register = [];
  if (existsSync(REGISTER_PATH)) register = JSON.parse(readFileSync(REGISTER_PATH, 'utf8'));
  const nextRefNum = register.length;
  const nextRef = 'BD-' + String(nextRefNum).padStart(3, '0');
  const registerEntry = {
    ref: nextRef,
    date: dateOnly,
    decision: 'The Department issued $DBD on Pump.fun and made it official.',
    status: 'Approved',
  };

  const logEntry = { mint, pumpfunUrl: url, creationSignature: sig, launchTimestamp: timestamp, solscan };

  const plan = [
    ['config.official_mint', cfg.official_mint + '  ->  ' + mint],
    ['config.launch_status', cfg.launch_status + '  ->  live'],
    ['config.launch_timestamp', String(cfg.launch_timestamp) + '  ->  ' + timestamp],
    ['config.config_version', cfg.config_version + '  ->  ' + nextVersion],
    ['register (+entry)', nextRef + ' ' + dateOnly + ' "' + registerEntry.decision + '"'],
    ['launch-log', LOG_PATH + '  (+1 entry)'],
    ['solscan mint link', solscan],
  ];

  console.log('\nDBD APPLY-LAUNCH  ' + (args.confirm ? '(WRITE)' : '(DRY RUN - no files changed)'));
  console.log('='.repeat(52));
  for (const [k, v] of plan) console.log('  ' + k.padEnd(24) + v);
  console.log('');

  if (!args.confirm) {
    console.log('Dry run only. Re-run with --confirm to write these changes, then:');
    console.log('  npm run build   &&   npm run postlaunch-check');
    return;
  }

  // ---- WRITE ----
  cfg.official_mint = mint;
  cfg.launch_status = 'live';
  cfg.launch_timestamp = timestamp;
  cfg.config_version = nextVersion;
  cfg.last_updated = timestamp;
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');

  register.push(registerEntry);
  writeFileSync(REGISTER_PATH, JSON.stringify(register, null, 2) + '\n');

  let log = [];
  if (existsSync(LOG_PATH)) { try { log = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch { log = []; } }
  if (!Array.isArray(log)) log = [];
  log.push(logEntry);
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n');

  console.log('Written. Now run:');
  console.log('  npm run build');
  console.log('  npm run postlaunch-check');
  console.log('  git add -A && git commit -m "Go live: publish $DBD mint" && git push origin main');
  console.log('\nMint is now exposed on Transparency and Public Records after the build. Anti-scam notices are unchanged.');
}

main();

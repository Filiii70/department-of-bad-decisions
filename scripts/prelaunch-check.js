#!/usr/bin/env node
// DBD pre-launch checker. Read-only, no network required.
// Verifies the repo is in a correct, honest pre-launch state and that no
// secrets or fake values have crept in. Exits non-zero on any CRITICAL failure.

import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, validateConfig, isPlaceholder, isHttpUrl, MINT_NOT_ISSUED } from './lib/config.js';
import { isValidSolanaAddress } from './lib/solana.js';
import { scanForSecrets, gitignoreCoversSecrets } from './lib/secret-scan.js';
import { leader, heading } from './lib/report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const checks = [];
// severity: 'critical' -> failing exits non-zero; 'warn' -> reported, exit 0.
function record(label, pass, severity, detail) {
  checks.push({ label, pass, severity, detail });
}

function run() {
  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    console.error('CRITICAL: could not load config/dbd.config.json: ' + err.message);
    process.exit(2);
  }

  // 1. Configuration structural validity
  const v = validateConfig(cfg);
  record('Configuration', v.ok, 'critical', v.errors.join('; '));
  for (const w of v.warnings) record('Config placeholder', false, 'warn', w);

  // 2. Identity fields
  record('Project name', cfg.project_name === 'Department of Bad Decisions', 'critical', cfg.project_name);
  record('Ticker', cfg.ticker === 'DBD', 'critical', cfg.ticker);
  record('Network is Solana', cfg.network === 'solana', 'critical', cfg.network);

  // 3. Launch status must be prelaunch
  record('Launch status prelaunch', cfg.launch_status === 'prelaunch', 'critical',
    `status is "${cfg.launch_status}"`);

  // 4. Social link formats (placeholder = warn, malformed real value = critical)
  for (const f of ['official_x', 'official_telegram', 'official_github', 'official_website']) {
    if (isPlaceholder(cfg[f])) {
      record(`Social: ${f}`, false, 'warn', 'placeholder, fill before launch');
    } else {
      record(`Social: ${f}`, isHttpUrl(cfg[f]), 'critical', cfg[f]);
    }
  }

  // 5. Mint must NOT be a real/fake address before launch
  const mintIssuedLooking = isValidSolanaAddress(cfg.official_mint);
  record('Mint not yet created', cfg.official_mint === MINT_NOT_ISSUED, 'critical',
    mintIssuedLooking
      ? 'a real-looking mint is set while status is prelaunch (remove it or go live)'
      : `mint = ${cfg.official_mint}`);

  // 6. Disclaimer present
  record('Disclaimer text', typeof cfg.disclaimer_text === 'string' && cfg.disclaimer_text.length > 40,
    'critical', 'legal/anti-scam text required');

  // 7. No obvious placeholder production URL for the website
  record('Website URL not placeholder', !isPlaceholder(cfg.official_website), 'warn',
    'official_website still a placeholder');

  // 8. Security scan for secret-like content
  const findings = scanForSecrets(ROOT);
  record('Security scan', findings.length === 0, 'critical',
    findings.map((f) => `${f.pattern} in ${f.file}:${f.line}`).join(' | '));

  // 9. No tracked .env; .gitignore covers secrets
  record('No committed .env', !existsSync(join(ROOT, '.env')), 'critical', '.env present at repo root');
  const gi = gitignoreCoversSecrets(ROOT);
  record('.gitignore secret patterns', gi.ok, 'critical', gi.missing.join(', '));

  // 10. Required assets exist
  const requiredAssets = [
    'assets/favicon.svg',
    'assets/approved-stamp.svg',
    'site/styles/main.css',
    'site/scripts/site.js',
    'site/src/index.html',
    'config/dbd.config.json',
  ];
  const missingAssets = requiredAssets.filter((p) => !existsSync(join(ROOT, p)));
  record('Required assets', missingAssets.length === 0, 'critical', 'missing: ' + missingAssets.join(', '));

  // 11. Website builds successfully
  let buildOk = false;
  let buildDetail = '';
  try {
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
    buildOk = existsSync(join(ROOT, 'site', 'dist', 'index.html'))
      && existsSync(join(ROOT, 'site', 'dist', 'config.json'));
    if (!buildOk) buildDetail = 'dist output incomplete';
  } catch (err) {
    buildDetail = 'build script failed: ' + (err.stderr ? err.stderr.toString().slice(0, 200) : err.message);
  }
  record('Website build', buildOk, 'critical', buildDetail);

  print();
}

function print() {
  console.log(heading('DBD PRE-LAUNCH CHECK'));

  // Grouped summary lines matching the requested style.
  const groups = [
    ['Website', ['Website build', 'Required assets']],
    ['Configuration', ['Configuration', 'Project name', 'Ticker', 'Network is Solana', 'Launch status prelaunch', 'Disclaimer text']],
    ['Social links', ['Social: official_x', 'Social: official_telegram', 'Social: official_github', 'Social: official_website']],
    ['Security scan', ['Security scan']],
    ['Secrets', ['No committed .env', '.gitignore secret patterns']],
  ];

  console.log('');
  for (const [title, labels] of groups) {
    const relevant = checks.filter((c) => labels.includes(c.label));
    const anyFailCritical = relevant.some((c) => !c.pass && c.severity === 'critical');
    const anyWarn = relevant.some((c) => !c.pass && c.severity === 'warn');
    const word = anyFailCritical ? 'FAIL' : anyWarn ? 'WARN' : 'PASS';
    console.log(leader(title, word, 18));
  }
  // Mint line special-cased to match the requested wording.
  const mintCheck = checks.find((c) => c.label === 'Mint not yet created');
  console.log(leader('Mint address', mintCheck && mintCheck.pass ? 'NOT YET CREATED' : 'CHECK FAILED', 18));

  // Detailed failures / warnings
  const criticalFails = checks.filter((c) => !c.pass && c.severity === 'critical');
  const warns = checks.filter((c) => !c.pass && c.severity === 'warn');

  if (warns.length) {
    console.log('\nWarnings (fill before launch, not blocking):');
    for (const w of warns) console.log('  - ' + w.label + (w.detail ? ': ' + w.detail : ''));
  }
  if (criticalFails.length) {
    console.log('\nCritical failures:');
    for (const c of criticalFails) console.log('  - ' + c.label + (c.detail ? ': ' + c.detail : ''));
  }

  const failed = criticalFails.length > 0;
  const status = failed ? 'NOT READY' : warns.length ? 'READY (with warnings to fill before launch)' : 'READY';
  console.log('\nSTATUS: ' + status);
  process.exit(failed ? 1 : 0);
}

run();

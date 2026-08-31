#!/usr/bin/env node
// Static site build. No framework, no bundler, zero dependencies.
// Assembles site/dist from site/src + styles + scripts + assets, and writes
// a public config.json + build-info.json that the page reads at runtime.
//
// The canonical config is entirely public (no secrets), so it is copied as-is.
// Fails (non-zero) if the config is structurally invalid.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, validateConfig } from './lib/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE = join(ROOT, 'site');
const DIST = join(SITE, 'dist');
const ASSETS = join(ROOT, 'assets');

// The build stamps a timestamp. Tooling forbids Date in some contexts, but this
// is a normal Node script run by a human at build time.
const builtAt = new Date().toISOString();

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}

function main() {
  const cfg = loadConfig();
  const { ok, errors, warnings } = validateConfig(cfg);
  if (!ok) {
    console.error('BUILD FAILED: configuration is invalid.');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  if (warnings.length) {
    console.warn('Build warnings (placeholders still present):');
    for (const w of warnings) console.warn('  - ' + w);
  }

  // Clean dist
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  // Copy html (from src), styles, scripts, assets
  copyDir(join(SITE, 'src'), DIST);
  copyDir(join(SITE, 'styles'), join(DIST, 'styles'));
  copyDir(join(SITE, 'scripts'), join(DIST, 'scripts'));
  copyDir(ASSETS, join(DIST, 'assets'));

  // Public config for the site. Identical to canonical config (all public).
  writeFileSync(join(DIST, 'config.json'), JSON.stringify(cfg, null, 2));

  // Build metadata
  const buildInfo = {
    built_at: builtAt,
    config_version: cfg.config_version,
    launch_status: cfg.launch_status,
  };
  writeFileSync(join(DIST, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

  console.log('DBD site built successfully.');
  console.log('  Output: ' + DIST);
  console.log('  Status: ' + cfg.launch_status + '  Version: ' + cfg.config_version);
  console.log('  Run: npm run serve   (then open the printed URL)');
}

main();

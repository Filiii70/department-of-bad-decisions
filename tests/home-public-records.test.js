/* Regression coverage for the homepage Public Records verification section.
   This validates the BUILT/renderable output (dist/index.html + the renderer that
   feeds it + the canonical config), not an unrelated source file. It must fail if
   the section, its anchor, its heading, the canonical wiring, the pre-launch mint
   warning, the wallet roles, the GitHub link, or the Transparency link disappear. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'site', 'dist');

function build() {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
}

test('built homepage contains the Public Records section with a working anchor', () => {
  build();
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  // Anchor target #public-records must resolve to a real element on the homepage.
  assert.match(html, /id="public-records"/, 'id="public-records" is missing from the homepage');
  // Prominent heading and the verify tagline.
  assert.match(html, /Public Records<\/h2>|>Public Records<\/h2>/i, 'the "Public Records" heading is missing');
  assert.match(html, /Don't trust us\. Verify us\./i, 'the "Don\'t trust us. Verify us." tagline is missing');
});

test('built homepage shows the pre-launch no-mint warning while the mint is NOT_YET_ISSUED', () => {
  build();
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const cfg = JSON.parse(readFileSync(join(DIST, 'config.json'), 'utf8'));
  assert.equal(cfg.official_mint, 'NOT_YET_ISSUED', 'official_mint must remain NOT_YET_ISSUED pre-launch');
  assert.equal(cfg.launch_status, 'prelaunch', 'launch_status must remain prelaunch');
  assert.match(html, /No official \$DBD contract address exists yet/i, 'the pre-launch no-mint warning is missing');
  assert.match(html, /not verified by the Department/i, 'the "not verified by the Department" warning is missing');
});

test('homepage Public Records links to the full Transparency file', () => {
  build();
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const section = html.slice(html.indexOf('id="public-records"'));
  assert.match(section, /href="\.\/transparency\.html"/, 'the Full Transparency file link is missing from Public Records');
  // The renderer must be wired into the page.
  assert.match(html, /scripts\/public-records\.js/, 'the public-records.js renderer is not included on the homepage');
});

test('Public Records renderer consumes canonical config (single source of truth)', () => {
  build();
  const js = readFileSync(join(DIST, 'scripts', 'public-records.js'), 'utf8');
  assert.match(js, /config\.json/, 'renderer does not load config.json');
  // Every canonical field the section exposes must be read from config, not hard-coded.
  for (const field of [
    'creator_wallet', 'treasury_wallet', 'operational_wallet',
    'official_website', 'official_x', 'official_telegram', 'official_github',
    'project_name', 'ticker', 'launch_status', 'network', 'official_mint',
  ]) {
    assert.match(js, new RegExp('cfg\\.' + field + '\\b'), 'renderer does not consume canonical field: ' + field);
  }
  // Wallet roles must be present so all three wallets render.
  for (const role of ['Creator', 'Treasury', 'Operations']) {
    assert.match(js, new RegExp("role: '" + role + "'"), 'wallet role missing from renderer: ' + role);
  }
  // Solscan account links and no-balances stance.
  assert.match(js, /\/account\//, 'renderer does not build Solscan account links');
});

test('homepage still exposes the pr-* value slots the renderer fills', () => {
  build();
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  for (const id of ['pr-project', 'pr-token', 'pr-status', 'pr-network', 'pr-mint', 'pr-wallets', 'pr-website', 'pr-x', 'pr-telegram', 'pr-github']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing Public Records slot: ' + id);
  }
});

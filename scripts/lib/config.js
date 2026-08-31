// Canonical config loader + validation helpers.
// Pure, no network, no secrets. Used by every script and every test.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CONFIG_PATH = resolve(__dirname, '..', '..', 'config', 'dbd.config.json');

export const EXPECTED = Object.freeze({
  project_name: 'Department of Bad Decisions',
  ticker: 'DBD',
  network: 'solana',
});

export const PLACEHOLDER_MARKERS = ['REPLACE_ME', 'TODO', '.example'];
export const MINT_NOT_ISSUED = 'NOT_YET_ISSUED';

export const REQUIRED_FIELDS = [
  'config_version',
  'last_updated',
  'project_name',
  'ticker',
  'network',
  'launch_status',
  'launch_platform',
  'launch_timestamp',
  'official_mint',
  'creator_wallet',
  'treasury_wallet',
  'operational_wallet',
  'official_x',
  'official_telegram',
  'official_github',
  'official_website',
  'explorer_base_url',
  'disclaimer_text',
];

export function loadConfig(path = CONFIG_PATH) {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

// Returns true when the value is a human-fillable placeholder rather than
// real data. `NOT_YET_ISSUED` for the mint is a valid pre-launch state and is
// NOT treated as a generic placeholder here (handled separately).
export function isPlaceholder(value) {
  if (typeof value !== 'string') return false;
  return PLACEHOLDER_MARKERS.some((m) => value.includes(m));
}

export function isHttpUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isIsoTimestamp(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}T/.test(value);
}

// Structural validation of the config document. Returns { ok, errors, warnings }.
// `errors` are hard (a broken config), `warnings` are unfilled placeholders.
export function validateConfig(cfg) {
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in cfg)) errors.push(`Missing required field: ${field}`);
  }

  if (cfg.project_name !== EXPECTED.project_name) {
    errors.push(`project_name must be "${EXPECTED.project_name}"`);
  }
  if (cfg.ticker !== EXPECTED.ticker) {
    errors.push(`ticker must be "${EXPECTED.ticker}"`);
  }
  if (cfg.network !== EXPECTED.network) {
    errors.push(`network must be "${EXPECTED.network}"`);
  }
  if (!['prelaunch', 'live'].includes(cfg.launch_status)) {
    errors.push('launch_status must be "prelaunch" or "live"');
  }
  if (typeof cfg.disclaimer_text !== 'string' || cfg.disclaimer_text.trim().length < 40) {
    errors.push('disclaimer_text is missing or too short');
  }

  // Placeholder warnings for fields a human must fill before launch.
  for (const field of [
    'creator_wallet',
    'treasury_wallet',
    'official_x',
    'official_telegram',
    'official_github',
    'official_website',
  ]) {
    if (isPlaceholder(cfg[field])) warnings.push(`${field} is still a placeholder`);
  }

  // URL format checks (only when not a placeholder, to avoid double-noise).
  for (const field of ['official_x', 'official_telegram', 'official_github', 'official_website']) {
    const v = cfg[field];
    if (!isPlaceholder(v) && !isHttpUrl(v)) {
      errors.push(`${field} is not a valid http(s) URL`);
    }
  }
  if (!isHttpUrl(cfg.explorer_base_url)) {
    errors.push('explorer_base_url is not a valid http(s) URL');
  }

  return { ok: errors.length === 0, errors, warnings };
}

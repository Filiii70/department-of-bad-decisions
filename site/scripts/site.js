/* Department of Bad Decisions - read-only portal renderer.
   Fetches config.json + build-info.json (static files from the build) and fills
   the government forms. No wallet connect, no login, no tracking, no writes.
   Progressive enhancement: if JS fails, the document structure still renders. */

const PLACEHOLDER_MARKERS = ['REPLACE_ME', 'TODO', '.example'];
const MINT_NOT_ISSUED = 'NOT_YET_ISSUED';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const isPlaceholder = (v) => typeof v === 'string' && PLACEHOLDER_MARKERS.some((m) => v.includes(m));
const el = (id) => document.getElementById(id);

// ---- element factories (mirror the CSS design-system components) ----
function statusField(text, variant) {
  const s = document.createElement('span');
  s.className = 'status' + (variant ? ' ' + variant : '');
  s.textContent = text;
  return s;
}

function pending() { return statusField('Pending Configuration', 'pending'); }

function extLink(href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label || href;
  a.rel = 'noopener noreferrer';
  a.target = '_blank';
  return a;
}

function explorerLink(base, kind, address) {
  const clean = String(base || '').replace(/\/$/, '');
  const a = extLink(`${clean}/${kind}/${address}`, address);
  a.className = 'addr-link';
  return a;
}

// Human date: "30 AUG 2026"; keep the raw ISO in a title attribute.
function humanDate(iso, withTime) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const base = `${day} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (!withTime) return base;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${base} · ${hh}:${mm} UTC`;
}

function setDate(id, iso, withTime) {
  const host = el(id);
  if (!host) return;
  const human = humanDate(iso, withTime);
  if (human) {
    host.textContent = human;
    host.setAttribute('title', iso); // raw machine data retained internally
  } else {
    host.textContent = iso || 'UNKNOWN';
  }
}

function set(id, node) {
  const host = el(id);
  if (!host) return;
  host.innerHTML = '';
  if (node == null) host.textContent = '';
  else if (typeof node === 'string') host.textContent = node;
  else host.appendChild(node);
}

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function render() {
  let cfg, build;
  try {
    [cfg, build] = await Promise.all([loadJson('./config.json'), loadJson('./build-info.json')]);
  } catch (err) {
    const banner = el('load-error');
    if (banner) {
      banner.style.display = 'block';
      banner.textContent =
        'NOTICE: configuration could not be loaded. Serve this portal over http (npm run serve), not from a file:// path.';
    }
    return;
  }

  const isLive = cfg.launch_status === 'live';
  const mintIssued = cfg.official_mint && cfg.official_mint !== MINT_NOT_ISSUED && !isPlaceholder(cfg.official_mint);

  // ---- Official Notice (single source of the prelaunch/live wording) ----
  const notice = el('official-notice');
  if (notice) {
    const tail = isLive ? 'has issued one.' : 'is preparing to issue one.';
    notice.innerHTML =
      'The Department does not recommend purchasing meme coins.<br />Unfortunately, the Department ' + tail;
  }

  // ---- Token File (FORM DBD-001) ----
  set('rec-name', cfg.project_name || 'PENDING');
  set('rec-ticker', cfg.ticker ? `$${cfg.ticker}` : 'PENDING');
  set('rec-network', (cfg.network || 'solana').toUpperCase());
  set('rec-status', statusField(isLive ? 'Live' : 'Pre-Launch', isLive ? 'stamp-red live' : 'stamp-red'));

  if (mintIssued) {
    set('rec-mint', explorerLink(cfg.explorer_base_url, 'token', cfg.official_mint));
    set('pub-mint', explorerLink(cfg.explorer_base_url, 'token', cfg.official_mint));
  } else {
    set('rec-mint', statusField('Not Yet Issued', 'pending'));
    set('pub-mint', statusField('Not Yet Issued', 'pending'));
  }

  // ---- Public Records (FORM DBD-002) ----
  const wallet = (addr) =>
    !addr || isPlaceholder(addr) ? pending() : explorerLink(cfg.explorer_base_url, 'account', addr);
  set('pub-creator', wallet(cfg.creator_wallet));
  set('pub-treasury', wallet(cfg.treasury_wallet));

  const opRow = el('pub-operational-row');
  if (cfg.operational_wallet && !isPlaceholder(cfg.operational_wallet)) {
    if (opRow) opRow.style.display = '';
    set('pub-operational', wallet(cfg.operational_wallet));
  } else if (opRow) {
    opRow.style.display = 'none';
  }

  const social = (url) => (isPlaceholder(url) || !url ? pending() : extLink(url));
  set('pub-x', social(cfg.official_x));
  set('pub-telegram', social(cfg.official_telegram));
  set('pub-github', social(cfg.official_github));

  // ---- Transparency (FORM DBD-003) ----
  set('t-github', social(cfg.official_github));
  set('t-status', statusField(isLive ? 'Live' : 'Pre-Launch', isLive ? 'stamp-red live' : 'stamp-red'));
  set('t-version', 'v' + (cfg.config_version || 'UNKNOWN'));
  setDate('t-updated', cfg.last_updated, false);
  // Build timestamp stays internal (build-info.json / machine-readable), not shown publicly.

  // ---- Legal (FORM DBD-000) ----
  set('disclaimer', cfg.disclaimer_text || '');

  // ---- Anti-scam name/ticker echoes ----
  document.querySelectorAll('[data-ticker]').forEach((n) => { n.textContent = `$${cfg.ticker}`; });
  document.querySelectorAll('[data-name]').forEach((n) => { n.textContent = cfg.project_name; });
}

// Trigger restrained load animations (stamps settling in) after first paint.
function armAnimations() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  armAnimations();
});

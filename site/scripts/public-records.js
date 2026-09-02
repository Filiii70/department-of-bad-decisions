/* Homepage Public Records - concise verification snapshot ("Don't trust us. Verify us.").
   Read-only. Renders exclusively from the canonical config.json produced by the build.
   The section's headings, labels, warning and transparency link are static HTML, so the
   section is never invisible; this script fills the canonical VALUES (wallets, channels,
   status, mint) and shows a visible message if config cannot be loaded. No second source
   of truth, no balances, no wallet connect, no tracking. */

const PLACEHOLDER_MARKERS = ['REPLACE_ME', 'TODO', '.example'];
const MINT_NOT_ISSUED = 'NOT_YET_ISSUED';
const isPlaceholder = (v) => typeof v === 'string' && PLACEHOLDER_MARKERS.some((m) => v.includes(m));
const isReal = (v) => typeof v === 'string' && v.length > 0 && !isPlaceholder(v);
const el = (id) => document.getElementById(id);

function make(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function setText(id, text) { const h = el(id); if (h && text != null) h.textContent = text; }
function setNode(id, node) { const h = el(id); if (!h) return; h.innerHTML = ''; if (node) h.appendChild(node); }

function extLink(href, label) {
  const a = document.createElement('a');
  a.href = href; a.textContent = label || href;
  a.rel = 'noopener noreferrer'; a.target = '_blank';
  return a;
}

function shortAddr(a) { return (!a || a.length <= 12) ? (a || '') : a.slice(0, 4) + '…' + a.slice(-4); }
function solscanAccount(base, addr) { return String(base || 'https://solscan.io').replace(/\/$/, '') + '/account/' + addr; }

function walletCard(cfg, w) {
  const card = make('article', 'wallet-card');
  card.appendChild(make('div', 'wc-role', w.role));
  card.appendChild(make('div', 'wc-desc', w.desc));
  const addr = w.value;
  if (!isReal(addr)) { card.appendChild(make('span', 'status pending', 'Pending Configuration')); return card; }

  const url = solscanAccount(cfg.explorer_base_url, addr);
  const link = extLink(url, shortAddr(addr));
  link.className = 'wc-addr addr-link';
  link.setAttribute('title', addr);
  card.appendChild(link);

  const full = make('code', 'wc-full', addr);
  card.appendChild(full);

  const row = make('div', 'wc-actions');
  const copy = make('button', 'wc-copy', 'Copy full address');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    const done = () => { copy.textContent = 'Copied ✓'; copy.classList.add('is-copied'); setTimeout(() => { copy.textContent = 'Copy full address'; copy.classList.remove('is-copied'); }, 1600); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(addr); done(); return; }
      throw new Error('no clipboard');
    } catch {
      const r = document.createRange(); r.selectNode(full);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { document.execCommand('copy'); done(); } catch { copy.textContent = 'Select and copy'; }
      sel.removeAllRanges();
    }
  });
  row.appendChild(copy);
  const view = extLink(url, 'View on Solscan →'); view.className = 'wc-solscan';
  row.appendChild(view);
  card.appendChild(row);
  return card;
}

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + path + ': ' + res.status);
  return res.json();
}

async function render() {
  const section = el('public-records');
  if (!section) return;

  let cfg;
  try {
    cfg = await loadJson('./config.json');
  } catch {
    const err = el('pr-loaderr');
    if (err) { err.style.display = 'block'; err.textContent = 'NOTICE: the public record could not be loaded. Serve this portal over http (npm run serve), not from a file:// path. The full record is always available on the Verify page.'; }
    return;
  }

  const mintIssued = isReal(cfg.official_mint) && cfg.official_mint !== MINT_NOT_ISSUED;

  // Project snapshot (canonical values overwrite the static defaults)
  if (isReal(cfg.project_name)) setText('pr-project', cfg.project_name);
  setText('pr-token', cfg.ticker ? '$' + cfg.ticker : '$DBD');
  setText('pr-status', cfg.launch_status === 'live' ? 'Live' : 'Pre-Launch');
  setText('pr-network', (cfg.network || 'solana').replace(/^./, (c) => c.toUpperCase()));
  if (mintIssued) {
    const link = extLink(String(cfg.explorer_base_url || 'https://solscan.io').replace(/\/$/, '') + '/token/' + cfg.official_mint, cfg.official_mint);
    link.className = 'addr-link';
    setNode('pr-mint', link);
  } else {
    setText('pr-mint', 'Not Yet Issued');
  }

  // Wallets
  const grid = el('pr-wallets');
  if (grid) {
    grid.innerHTML = '';
    const wallets = [
      { role: 'Creator', desc: 'Deploys and controls the project. The launch originates here.', value: cfg.creator_wallet },
      { role: 'Treasury', desc: 'Holds project funds. Any movement is on-chain and public.', value: cfg.treasury_wallet },
      { role: 'Operations', desc: 'Day-to-day operational spending, kept separate from treasury.', value: cfg.operational_wallet },
    ];
    wallets.forEach((w) => grid.appendChild(walletCard(cfg, w)));
  }

  // Channels
  setNode('pr-website', isReal(cfg.official_website) ? extLink(cfg.official_website) : make('span', 'status pending', 'Pending Configuration'));
  setNode('pr-x', isReal(cfg.official_x) ? extLink(cfg.official_x) : make('span', 'status pending', 'Pending Configuration'));
  setNode('pr-telegram', isReal(cfg.official_telegram) ? extLink(cfg.official_telegram) : make('span', 'status pending', 'Pending Configuration'));
  setNode('pr-github', isReal(cfg.official_github) ? extLink(cfg.official_github) : make('span', 'status pending', 'Public repository — not yet released'));
}

document.addEventListener('DOMContentLoaded', render);

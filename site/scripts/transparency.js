/* Department of Bad Decisions - public verification page ("Don't trust us. Verify us.").
   Read-only. Renders exclusively from the canonical config.json produced by the build.
   No wallet connect, no tracking, no backend, no writes. If a value is a placeholder
   or not yet issued, that state is shown honestly - never a fabricated URL, mint or balance. */

const PLACEHOLDER_MARKERS = ['REPLACE_ME', 'TODO', '.example'];
const MINT_NOT_ISSUED = 'NOT_YET_ISSUED';
const isPlaceholder = (v) => typeof v === 'string' && PLACEHOLDER_MARKERS.some((m) => v.includes(m));
const isReal = (v) => typeof v === 'string' && v.length > 0 && !isPlaceholder(v);
const el = (id) => document.getElementById(id);

function set(id, node) {
  const host = el(id);
  if (!host) return;
  host.innerHTML = '';
  if (node == null) host.textContent = '';
  else if (typeof node === 'string') host.textContent = node;
  else host.appendChild(node);
}

function make(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

function extLink(href, label) {
  const a = document.createElement('a');
  a.href = href; a.textContent = label || href;
  a.rel = 'noopener noreferrer'; a.target = '_blank';
  return a;
}

function pending(text) { const s = make('span', 'status pending', text || 'Pending Configuration'); return s; }

function shortAddr(a) {
  if (!a || a.length <= 12) return a || '';
  return a.slice(0, 4) + '…' + a.slice(-4);
}

function solscanAccount(base, addr) {
  const clean = String(base || 'https://solscan.io').replace(/\/$/, '');
  return `${clean}/account/${addr}`;
}

// A full wallet card: role, shortened address, copy-to-clipboard, Solscan link. No balance.
function walletCard(cfg, w) {
  const card = make('article', 'wallet-card');
  card.appendChild(make('div', 'wc-role', w.role));
  card.appendChild(make('div', 'wc-desc', w.desc));

  const addr = w.value;
  if (!isReal(addr)) {
    card.appendChild(pending('Pending Configuration'));
    return card;
  }

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
  copy.setAttribute('data-addr', addr);
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
  const view = extLink(url, 'View on Solscan →');
  view.className = 'wc-solscan';
  row.appendChild(view);
  card.appendChild(row);
  return card;
}

// Bad Decision Register. Add future entries here; each may carry an optional ISO `date`.
const REGISTER = [
  { ref: 'BD-000', date: null, decision: 'The Department decided to launch a meme coin.', status: 'Approved' },
];

function registerEntry(e) {
  const item = make('article', 'reg-entry');
  const head = make('div', 'reg-head');
  head.appendChild(make('span', 'reg-ref', e.ref || ''));
  head.appendChild(make('span', 'reg-date', e.date ? e.date : 'FILED: PRE-LAUNCH'));
  item.appendChild(head);
  item.appendChild(make('p', 'reg-decision', e.decision));
  const foot = make('div', 'reg-foot');
  const stamp = make('span', 'stamp small');
  stamp.appendChild(make('span', 'stamp-main', e.status || 'Approved'));
  foot.appendChild(make('span', 'reg-status-label', 'Status:'));
  foot.appendChild(stamp);
  item.appendChild(foot);
  return item;
}

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function render() {
  let cfg;
  try {
    cfg = await loadJson('./config.json');
  } catch {
    const banner = el('load-error');
    if (banner) { banner.style.display = 'block'; banner.textContent = 'NOTICE: configuration could not be loaded. Serve this portal over http (npm run serve), not from a file:// path.'; }
    return;
  }

  const isLive = cfg.launch_status === 'live';
  const mintIssued = isReal(cfg.official_mint) && cfg.official_mint !== MINT_NOT_ISSUED;

  // 1 - PROJECT STATUS
  set('ps-token', cfg.ticker ? `$${cfg.ticker}` : 'PENDING');
  set('ps-status', make('span', 'status stamp-red', isLive ? 'Live' : 'Pre-Launch'));
  set('ps-network', (cfg.network || 'solana').toUpperCase());
  set('ps-platform', cfg.launch_platform || 'Pump.fun');
  const mintNode = () => mintIssued ? extLink(solscanAccount(cfg.explorer_base_url, cfg.official_mint).replace('/account/', '/token/'), cfg.official_mint) : make('span', 'status pending', 'Not Yet Issued');
  set('ps-mint', mintNode());
  set('lp-mint', mintNode());

  // 2 - OFFICIAL WALLETS
  const grid = el('wallet-grid');
  if (grid) {
    grid.innerHTML = '';
    const wallets = [
      { role: 'Creator Wallet', desc: 'Deploys and controls the project. The launch originates from here.', value: cfg.creator_wallet },
      { role: 'Treasury Wallet', desc: 'Holds project funds. Any official treasury movement is on-chain and public.', value: cfg.treasury_wallet },
      { role: 'Operational Wallet', desc: 'Day-to-day operational spending. Kept separate from the treasury.', value: cfg.operational_wallet },
    ];
    wallets.forEach((w) => grid.appendChild(walletCard(cfg, w)));
  }

  // 3 - OFFICIAL CHANNELS
  set('ch-website', isReal(cfg.official_website) ? extLink(cfg.official_website) : pending());
  set('ch-x', isReal(cfg.official_x) ? extLink(cfg.official_x) : pending());
  set('ch-telegram', isReal(cfg.official_telegram) ? extLink(cfg.official_telegram) : pending());
  // GitHub: repository is not public yet - never render a fabricated URL.
  set('ch-github', isReal(cfg.official_github)
    ? extLink(cfg.official_github)
    : make('span', 'status pending', 'Public repository — not yet released'));

  // 8 - BAD DECISION REGISTER
  const reg = el('register-list');
  if (reg) { reg.innerHTML = ''; REGISTER.forEach((e) => reg.appendChild(registerEntry(e))); }

  // 9 - DISCLAIMER (canonical, verbatim from config)
  set('disclaimer', cfg.disclaimer_text || '');
}

document.addEventListener('DOMContentLoaded', render);

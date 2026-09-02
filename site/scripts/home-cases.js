/* Homepage "Current EU Case Files" — features the current EU Desk dossiers
   (Qatargate, Huaweigate) as strong, editorial case cards on the front door.
   Read-only, no backend. Source of truth: data/eu-cases.json. Facts and legal
   classifications are used verbatim from the approved case data. */

import { hasValue, validateCase } from './lib/eu.js';

const MAX_HOME = 4;

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

async function loadJson(path, fb) {
  try { const r = await fetch(path, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; }
}

function statusClass(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('convicted')) return 'convicted';
  if (l.includes('acquit') || l.includes('dismiss') || l.includes('closed')) return 'closed';
  return 'ongoing';
}

// A short, plain-English teaser from the approved citizen summary (never rewritten facts).
function teaser(c) {
  const t = (c.citizen && c.citizen.whatHappened) || c.subtitle || '';
  if (t.length <= 210) return t;
  const cut = t.slice(0, 210);
  const dot = cut.lastIndexOf('. ');
  return dot > 90 ? cut.slice(0, dot + 1) : cut.trim() + '…';
}

function money(c) {
  if (c.citizen && c.citizen.money && hasValue(c.citizen.money.figure)) return c.citizen.money;
  return null;
}

function caseCard(c) {
  const href = './eu-desk.html?case=' + encodeURIComponent(c.caseNumber);
  const card = el('article', 'eu-home-card');
  card.appendChild(el('div', 'ehc-spine'));

  const top = el('div', 'ehc-top');
  top.appendChild(el('span', 'ehc-no', c.caseNumber));
  if (c.currentStatus && hasValue(c.currentStatus.statusLabel)) {
    top.appendChild(el('span', 'ehc-status ' + statusClass(c.currentStatus.statusLabel), c.currentStatus.statusLabel));
  }
  card.appendChild(top);

  const title = el('h3', 'ehc-title');
  const a = el('a', null, c.title || 'Untitled'); a.href = href;
  title.appendChild(a);
  card.appendChild(title);

  const m = money(c);
  if (m) {
    const box = el('div', 'ehc-money');
    box.appendChild(el('div', 'ehc-money-figure', m.figure));
    if (hasValue(m.label)) box.appendChild(el('div', 'ehc-money-label', m.label));
    card.appendChild(box);
  }

  const t = teaser(c);
  if (hasValue(t)) card.appendChild(el('p', 'ehc-teaser', t));

  const john = c.citizen && c.citizen.johnLine;
  if (hasValue(john)) card.appendChild(el('div', 'ehc-john', 'John: ' + john));

  const foot = el('div', 'ehc-foot');
  const cta = el('a', 'ehc-cta', 'Show receipts →'); cta.href = href;
  foot.appendChild(cta);
  const right = el('div', 'ehc-right');
  right.appendChild(el('span', 'source-status', 'Verified Public Record'));
  const stamp = el('span', 'stamp be-approved small');
  stamp.setAttribute('role', 'img'); stamp.setAttribute('aria-label', 'APPROVED');
  stamp.appendChild(el('span', 'stamp-main', 'Approved'));
  right.appendChild(stamp);
  foot.appendChild(right);
  card.appendChild(foot);
  return card;
}

async function main() {
  const grid = document.getElementById('home-files');
  if (!grid) return;
  let cases = await loadJson('./data/eu-cases.json', []);
  if (!Array.isArray(cases)) cases = [];
  cases = cases.filter((c) => c && c.sample !== true && validateCase(c).ok).slice(0, MAX_HOME);

  const count = document.getElementById('home-files-count');
  grid.innerHTML = '';
  if (!cases.length) {
    if (count) count.textContent = '0 files';
    const empty = el('div', 'be-empty');
    empty.appendChild(el('div', 'bee-title', 'No files published yet'));
    empty.appendChild(el('p', null, 'Case files appear here once verified against public sources.'));
    grid.appendChild(empty);
    return;
  }
  if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');
  cases.forEach((c) => grid.appendChild(caseCard(c)));
}

document.addEventListener('DOMContentLoaded', main);

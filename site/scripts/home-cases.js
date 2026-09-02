/* Homepage "Current EU Case Files" — features the EU Desk dossiers as strong,
   editorial case cards on the front door. The two newest/heaviest headline cases
   sit up top as large FEATURED FILES; the rest follow as substantial dossier
   cards. Read-only, no backend. Source of truth: data/eu-cases.json. Facts,
   money figures and legal classifications are used verbatim from approved data. */

import { hasValue, validateCase } from './lib/eu.js';

// Featured slots (large cards). The rest render as substantial dossier cards.
const FEATURED = ['DBD-EU-0001', 'DBD-EU-0002'];

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

async function loadJson(path, fb) {
  try { const r = await fetch(path, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; }
}

// Colour/verbal grouping derived from the approved status label. This is a
// rendering of existing data, never a new legal claim.
function statusClass(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('convicted') || l.includes('sentenced')) return 'convicted';
  if (l.includes('audit') || l.includes('conflict of interest') || l.includes('maladministration')) return 'audit';
  if (l.includes('acquit') || l.includes('dismiss') || l.includes('closed') || l.includes('no breach') || l.includes('no criminal')) return 'closed';
  return 'ongoing';
}

// A plain-English "kind" line so a citizen instantly sees criminal vs institutional.
function kindLine(cls) {
  if (cls === 'convicted') return 'Criminal conviction';
  if (cls === 'audit') return 'Institutional / audit finding';
  if (cls === 'closed') return 'No wrongdoing established';
  return 'Under investigation';
}

// A short, plain-English teaser from the approved citizen summary (never rewritten facts).
function teaser(c, max) {
  const t = (c.citizen && c.citizen.whatHappened) || c.subtitle || '';
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const dot = cut.lastIndexOf('. ');
  return dot > 90 ? cut.slice(0, dot + 1) : cut.trim() + '…';
}

function money(c) {
  if (c.citizen && c.citizen.money && hasValue(c.citizen.money.figure)) return c.citizen.money;
  return null;
}

function caseCard(c, featured) {
  const href = './eu-desk.html?case=' + encodeURIComponent(c.caseNumber);
  const card = el('article', 'eu-home-card' + (featured ? ' eu-home-card--featured' : ''));
  card.appendChild(el('div', 'ehc-spine'));

  const cls = (c.currentStatus && hasValue(c.currentStatus.statusLabel)) ? statusClass(c.currentStatus.statusLabel) : 'ongoing';

  const top = el('div', 'ehc-top');
  top.appendChild(el('span', 'ehc-no', c.caseNumber));
  if (c.currentStatus && hasValue(c.currentStatus.statusLabel)) {
    top.appendChild(el('span', 'ehc-status ' + cls, c.currentStatus.statusLabel));
  }
  card.appendChild(top);

  // Kind band: criminal conviction vs institutional/audit vs investigation.
  card.appendChild(el('div', 'ehc-kind ' + cls, kindLine(cls)));

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

  const t = teaser(c, featured ? 260 : 200);
  if (hasValue(t)) {
    card.appendChild(el('div', 'ehc-what', 'What happened?'));
    card.appendChild(el('p', 'ehc-teaser', t));
  }

  const john = c.citizen && c.citizen.johnLine;
  if (featured && hasValue(john)) card.appendChild(el('div', 'ehc-john', 'John: ' + john));

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
  const feat = document.getElementById('home-files-featured');
  const more = document.getElementById('home-files-more');
  if (!feat || !more) return;

  let cases = await loadJson('./data/eu-cases.json', []);
  if (!Array.isArray(cases)) cases = [];
  cases = cases.filter((c) => c && c.sample !== true && validateCase(c).ok);

  const count = document.getElementById('home-files-count');
  if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');

  feat.innerHTML = '';
  more.innerHTML = '';

  if (!cases.length) {
    const featLead = document.getElementById('home-files-featured-lead');
    const moreLead = document.getElementById('home-files-more-lead');
    if (featLead) featLead.style.display = 'none';
    if (moreLead) moreLead.style.display = 'none';
    const empty = el('div', 'be-empty');
    empty.appendChild(el('div', 'bee-title', 'No files published yet'));
    empty.appendChild(el('p', null, 'Case files appear here once verified against public sources.'));
    feat.appendChild(empty);
    return;
  }

  const featured = cases.filter((c) => FEATURED.includes(c.caseNumber));
  const rest = cases.filter((c) => !FEATURED.includes(c.caseNumber));

  featured.forEach((c) => feat.appendChild(caseCard(c, true)));
  rest.forEach((c) => more.appendChild(caseCard(c, false)));

  const moreLead = document.getElementById('home-files-more-lead');
  if (moreLead) moreLead.style.display = rest.length ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', main);

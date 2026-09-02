/* The Belgian Desk - data-driven renderer (read-only, no backend).
   Imports the shared library so validation/formatting is identical to the
   Node tests. Renders the archive, filters, bulletins and shareable, full
   dossier case pages from JSON data. Never fabricates a value; missing data is
   omitted or shown as NOT DOCUMENTED. Money categories are labelled precisely.
   The normal preview shows the SAME editorial content as production (no dev
   samples are ever loaded here). */

import { formatAmount, formatDate, hasValue, NOT_DOCUMENTED } from './lib/belgian.js';

// ---- tiny DOM helpers (textContent only -> facts render literally) ----
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function link(href, text, cls) {
  const a = el('a', cls, text || href);
  a.href = href; a.rel = 'noopener noreferrer'; a.target = '_blank';
  return a;
}
function mount(id, node) { const h = document.getElementById(id); if (h) { h.innerHTML = ''; if (node) h.appendChild(node); } }
function sub(t) { return el('div', 'sr-meta', t); }

const params = new URLSearchParams(location.search);
const caseParam = params.get('case');

async function loadJson(path, fallback) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}

function editorialNotice() {
  const wrap = el('section', 'editorial-notice');
  wrap.appendChild(el('span', 'en-badge', 'Editorial Notice'));
  const p = el('p');
  p.appendChild(document.createTextNode('Belgian Desk combines documented public information with obvious bureaucratic satire. '));
  p.appendChild(el('strong', null, 'Factual statements are sourced. Department assessments, stamps and commentary are editorial satire.'));
  wrap.appendChild(p);
  return wrap;
}

function belgianApproved(small) {
  const s = el('span', 'stamp be-approved' + (small ? ' small' : ''));
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'APPROVED');
  s.appendChild(el('span', 'stamp-main', 'Approved'));
  return s;
}

// Money categories with precise labels. `loss` flags red styling.
const MONEY_ROWS = [
  ['originalBudget', 'Original Budget', false],
  ['revisedBudget', 'Revised Budget', false],
  ['contractValue', 'Contract Value', false],
  ['currentEstimate', 'Cost Estimate', false],
  ['estimatedFinalCost', 'Estimated Final Cost', false],
  ['amountPaid', 'Amount Paid', false],
  ['additionalCost', 'Additional Cost', false],
  ['provision', 'Provision', false],
  ['claimedDamages', 'Claimed Damages', false],
  ['recoveredMoney', 'Recovered Money', false],
  ['amountRecovered', 'Amount Recovered', false],
  ['documentedLoss', 'Documented Loss', true],
];
// Preference order for a single headline figure, each correctly labelled.
const KEY_ORDER = [
  ['documentedLoss', 'Documented Loss'],
  ['additionalCost', 'Additional Cost'],
  ['amountPaid', 'Amount Paid'],
  ['contractValue', 'Contract Value'],
  ['estimatedFinalCost', 'Estimated Final Cost'],
  ['currentEstimate', 'Cost Estimate'],
  ['revisedBudget', 'Revised Budget'],
  ['originalBudget', 'Original Budget'],
  ['claimedDamages', 'Claimed Damages'],
];

export function keyMoney(c) {
  const m = c.publicMoney; if (!m) return null;
  // Preferred: an explicit, precisely-classified figures[] list.
  if (Array.isArray(m.figures) && m.figures.length) {
    const fig = m.figures.find((x) => x && x.amount !== NOT_DOCUMENTED && formatAmount(x.amount, m.currency));
    if (fig) return { label: fig.label || 'Amount', value: formatAmount(fig.amount, m.currency) };
  }
  for (const [k, label] of KEY_ORDER) {
    const f = formatAmount(m[k], m.currency);
    if (f && m[k] !== NOT_DOCUMENTED) return { label, value: f };
  }
  return null;
}

function moneyRecord(m) {
  if (!m) return null;
  const wrap = el('div', 'money-record');
  let any = false;
  // Preferred path: explicit figures[], each with its own classification, period and meaning.
  if (Array.isArray(m.figures) && m.figures.length) {
    for (const fig of m.figures) {
      const cell = el('div', 'money-cell' + (fig.loss ? ' loss' : ''));
      cell.appendChild(el('div', 'mc-k', fig.label || 'Amount'));
      if (fig.amount === NOT_DOCUMENTED) {
        cell.classList.add('notdoc');
        cell.appendChild(el('div', 'mc-v', 'NOT DOCUMENTED'));
      } else {
        const f = formatAmount(fig.amount, m.currency);
        cell.appendChild(el('div', 'mc-v', f || String(fig.amount)));
      }
      const bits = [fig.classification, fig.asOf ? ('As of ' + fig.asOf) : null, fig.represents].filter(hasValue);
      if (bits.length) cell.appendChild(el('div', 'mc-note', bits.join(' · ')));
      wrap.appendChild(cell); any = true;
    }
    if (hasValue(m.currentStatus)) {
      const cell = el('div', 'money-cell');
      cell.appendChild(el('div', 'mc-k', 'Current Status'));
      cell.appendChild(el('div', 'mc-v', m.currentStatus));
      wrap.appendChild(cell);
    }
    return wrap;
  }
  for (const [k, label, isLoss] of MONEY_ROWS) {
    if (!(k in m)) continue;
    const cell = el('div', 'money-cell' + (isLoss ? ' loss' : ''));
    cell.appendChild(el('div', 'mc-k', label));
    if (m[k] === NOT_DOCUMENTED) {
      cell.classList.add('notdoc');
      cell.appendChild(el('div', 'mc-v', 'NOT DOCUMENTED'));
    } else {
      const f = formatAmount(m[k], m.currency);
      if (!f) continue;
      cell.appendChild(el('div', 'mc-v', f));
    }
    wrap.appendChild(cell); any = true;
  }
  if (hasValue(m.currentStatus)) {
    const cell = el('div', 'money-cell');
    cell.appendChild(el('div', 'mc-k', 'Current Status'));
    cell.appendChild(el('div', 'mc-v', m.currentStatus));
    wrap.appendChild(cell); any = true;
  }
  return any ? wrap : null;
}

function sourceRecord(s) {
  const rec = el('div', 'source-record' + (s.primary ? ' is-primary' : ''));
  const line = el('div');
  if (s.primary) line.appendChild(el('span', 'sr-primary', 'Primary'));
  if (hasValue(s.sourceType)) line.appendChild(el('span', 'sr-type', s.sourceType));
  line.appendChild(el('span', 'sr-name', s.sourceName || s.institution || 'Source'));
  rec.appendChild(line);
  if (hasValue(s.sourceTitle)) rec.appendChild(el('div', 'sr-meta', s.sourceTitle));
  if (hasValue(s.sourceURL)) rec.appendChild(link(s.sourceURL, s.sourceURL));
  const meta = [];
  if (hasValue(s.institution)) meta.push(s.institution);
  if (hasValue(s.publicationDate)) meta.push('Published ' + (formatDate(s.publicationDate) || s.publicationDate));
  if (hasValue(s.accessDate)) meta.push('Accessed ' + (formatDate(s.accessDate) || s.accessDate));
  if (meta.length) rec.appendChild(el('div', 'sr-meta', meta.join(' · ')));
  return rec;
}

function timeline(items) {
  const ul = el('ul', 'case-timeline');
  for (const it of items) {
    const li = el('li');
    if (hasValue(it.date)) li.appendChild(el('div', 'tl-date', formatDate(it.date) || it.date));
    li.appendChild(el('div', 'tl-event', it.event || ''));
    ul.appendChild(li);
  }
  return ul;
}

function bulletList(items) {
  const ul = el('ul'); ul.style.margin = '4px 0 0'; ul.style.paddingLeft = '20px';
  items.forEach((t) => { if (hasValue(t)) ul.appendChild(el('li', null, t)); });
  return ul;
}

function officialFindings(items) {
  const wrap = el('div');
  items.forEach((f) => {
    const row = el('div', 'finding');
    if (hasValue(f.institution)) row.appendChild(el('span', 'finding-inst', f.institution));
    row.appendChild(el('span', 'finding-text', f.finding || f.text || ''));
    wrap.appendChild(row);
  });
  return wrap;
}

function whoInvolved(items) {
  const wrap = el('div', 'who-involved');
  items.forEach((p) => {
    const row = el('div', 'who-row');
    row.appendChild(el('span', 'who-name', p.name || p.institution || ''));
    if (hasValue(p.role)) row.appendChild(el('span', 'who-role', p.role));
    wrap.appendChild(row);
  });
  return wrap;
}

function clerkAssessment(a) {
  const wrap = el('div', 'clerk-assessment');
  const rows = [
    ['administrativeAmbition', 'Administrative Ambition'],
    ['financialJudgement', 'Financial Judgement'],
    ['administrativeCompetence', 'Administrative Competence'],
    ['paperworkGenerated', 'Paperwork Generated'],
    ['accountabilityStatus', 'Accountability'],
    ['lessonsLearned', 'Lessons Learned'],
    ['departmentVerdict', 'Department Verdict'],
  ];
  let any = false;
  for (const [k, label] of rows) {
    if (!hasValue(a[k])) continue;
    const row = el('div', 'ca-row');
    row.appendChild(el('div', 'ca-k', label));
    row.appendChild(el('div', 'ca-v', a[k]));
    wrap.appendChild(row); any = true;
  }
  return any ? wrap : null;
}

function illustrationFrame(ill) {
  // Only render a frame when real artwork exists. No placeholder / "pending" copy.
  if (!ill || !hasValue(ill.src)) return null;
  const frame = el('div', 'illus-frame');
  const img = document.createElement('img');
  img.src = ill.src; img.alt = ill.alt || 'Editorial illustration';
  frame.appendChild(img);
  if (hasValue(ill.caption)) frame.appendChild(el('div', 'illus-cap', ill.caption));
  return frame;
}

// =====================================================================
// ARCHIVE CARD
// =====================================================================
function caseCard(c) {
  const card = el('article', 'be-casefile');
  card.appendChild(el('div', 'be-tricolor-spine'));

  const head = el('div', 'cf-head');
  head.appendChild(el('span', 'cf-no', 'Case File ' + c.caseNumber));
  head.appendChild(el('span', 'cf-desk', c.category || 'Belgian Desk'));
  card.appendChild(head);

  const subj = el('h3', 'cf-subject');
  subj.appendChild(link('./belgian-desk.html?case=' + encodeURIComponent(c.caseNumber), c.title, 'cf-subject-link'));
  card.appendChild(subj);

  const instBits = [c.institution, c.governmentLevel].filter(hasValue).join(' · ');
  if (instBits) card.appendChild(el('div', 'cf-inst', instBits));

  const km = keyMoney(c);
  if (km) {
    const box = el('div', 'cf-money-key');
    box.appendChild(el('div', 'k', km.label));
    box.appendChild(el('div', 'v', km.value));
    card.appendChild(box);
  }

  const verdict = c.clerkAssessment && (c.clerkAssessment.departmentVerdict || c.clerkAssessment.financialJudgement);
  if (verdict) {
    const s = el('div', 'layer layer-satire');
    s.style.padding = '8px 10px'; s.style.margin = '8px 0 0';
    s.appendChild(el('span', 'layer-label', 'Department Commentary'));
    s.appendChild(el('div', null, 'Verdict: ' + verdict));
    card.appendChild(s);
  }

  const foot = el('div', 'cf-foot');
  foot.appendChild(el('span', 'source-status', 'Verified Public Record'));
  foot.appendChild(belgianApproved(true));
  card.appendChild(foot);
  return card;
}

// =====================================================================
// FULL DOSSIER (shareable)
// =====================================================================
function caseDetail(c) {
  const root = el('div');

  // Header
  const header = el('section', 'gov-form');
  const fh = el('div', 'form-head');
  const left = el('div', 'fh-left');
  left.appendChild(el('div', 'fh-id', 'Case File ' + c.caseNumber));
  left.appendChild(el('div', 'fh-title', c.title || 'Untitled Case'));
  if (hasValue(c.subtitle)) left.appendChild(el('div', 'cf-inst', c.subtitle));
  fh.appendChild(left);
  const meta = el('div', 'fh-meta');
  [c.institution, c.governmentLevel, c.location, formatDate(c.date) || c.date, c.status]
    .filter(hasValue).forEach((b) => meta.appendChild(el('div', null, b)));
  fh.appendChild(meta);
  header.appendChild(fh);
  const hb = el('div', 'form-body');
  hb.appendChild(el('span', 'source-status', 'Verified Public Record'));
  header.appendChild(hb);
  root.appendChild(header);

  root.appendChild(editorialNotice());
  const ill = illustrationFrame(c.illustration);
  if (ill) root.appendChild(ill);

  // LAYER 1 - PUBLIC RECORD (facts), as a full dossier
  const fact = el('section', 'layer layer-fact');
  fact.appendChild(el('span', 'layer-label', 'Public Record · Sourced'));

  const exec = c.executiveSummary || c.summary;
  if (hasValue(exec)) { fact.appendChild(sub('Executive summary')); fact.appendChild(el('p', null, exec)); }

  const plan = c.originalPlan || c.intended;
  if (hasValue(plan)) { fact.appendChild(sub('The original plan')); fact.appendChild(el('p', null, plan)); }

  if (hasValue(c.actual)) { fact.appendChild(sub('What actually happened')); fact.appendChild(el('p', null, c.actual)); }

  const mr = moneyRecord(c.publicMoney);
  if (mr) { fact.appendChild(sub('The money (documented, by category)')); fact.appendChild(mr); }

  if (Array.isArray(c.timeline) && c.timeline.length) { fact.appendChild(sub('Timeline')); fact.appendChild(timeline(c.timeline)); }

  if (Array.isArray(c.whatChanged) && c.whatChanged.length) { fact.appendChild(sub('What changed')); fact.appendChild(bulletList(c.whatChanged)); }

  if (Array.isArray(c.officialFindings) && c.officialFindings.length) { fact.appendChild(sub('Official findings')); fact.appendChild(officialFindings(c.officialFindings)); }

  if (Array.isArray(c.whoInvolved) && c.whoInvolved.length) { fact.appendChild(sub('Who was involved')); fact.appendChild(whoInvolved(c.whoInvolved)); }
  else if (Array.isArray(c.people) && c.people.length) { fact.appendChild(sub('Named in the public record')); fact.appendChild(el('p', null, c.people.join(', '))); }

  if (hasValue(c.currentStatus)) { fact.appendChild(sub('Current status')); fact.appendChild(el('p', null, c.currentStatus)); }
  else if (hasValue(c.documentedOutcome)) { fact.appendChild(sub('Current status')); fact.appendChild(el('p', null, c.documentedOutcome)); }
  if (hasValue(c.lastVerified)) fact.appendChild(el('div', 'last-verified', 'Last verified: ' + (formatDate(c.lastVerified) || c.lastVerified)));

  // Source file
  fact.appendChild(sub('Source file'));
  if (Array.isArray(c.sources) && c.sources.length) c.sources.forEach((s) => fact.appendChild(sourceRecord(s)));
  else fact.appendChild(el('p', null, 'No sources attached.'));
  root.appendChild(fact);

  // LAYER 2 - DEPARTMENT COMMENTARY (satire)
  const ca = clerkAssessment(c.clerkAssessment || {});
  if (ca || hasValue(c.departmentNotes)) {
    const satire = el('section', 'layer layer-satire');
    satire.appendChild(el('span', 'layer-label', "The Clerk's Assessment · Editorial Satire"));
    if (ca) satire.appendChild(ca);
    if (hasValue(c.departmentNotes)) satire.appendChild(el('p', null, c.departmentNotes));
    satire.appendChild(el('div', 'satire-note', 'These assessments are editorial satire, not sourced facts.'));
    const stampWrap = el('div'); stampWrap.style.marginTop = '14px';
    stampWrap.appendChild(belgianApproved(false));
    satire.appendChild(stampWrap);
    root.appendChild(satire);
  }
  return root;
}

// =====================================================================
// BULLETIN
// =====================================================================
function bulletin(b) {
  const n = b.caseNumber || b.bulletinNumber;
  const wrap = el('article', 'be-bulletin');
  wrap.appendChild(el('div', 'be-tricolor-spine'));
  const head = el('div', 'bb-head');
  head.appendChild(el('span', 'bb-title', 'Department Bulletin'));
  head.appendChild(el('span', 'bb-no', n));
  wrap.appendChild(head);
  wrap.appendChild(el('div', 'bb-subject', b.subject || ''));
  if (hasValue(b.publicRecord)) {
    const f = el('div', 'layer layer-fact'); f.style.padding = '10px 12px';
    f.appendChild(el('span', 'layer-label', 'Public Record'));
    f.appendChild(el('p', null, b.publicRecord));
    if (Array.isArray(b.sources)) b.sources.forEach((s) => f.appendChild(sourceRecord(s)));
    wrap.appendChild(f);
  }
  if (hasValue(b.departmentResponse)) {
    const s = el('div', 'layer layer-satire'); s.style.padding = '10px 12px';
    s.appendChild(el('span', 'layer-label', 'Department Response · Satire'));
    s.appendChild(el('p', null, b.departmentResponse));
    const sw = el('div'); sw.style.marginTop = '10px'; sw.appendChild(belgianApproved(true));
    s.appendChild(sw);
    wrap.appendChild(s);
  }
  return wrap;
}

// =====================================================================
// FILTERS + ARCHIVE
// =====================================================================
function buildFilters(cases, onChange) {
  const host = document.getElementById('be-filters');
  if (!host) return;
  host.innerHTML = '';
  const facets = [['category'], ['governmentLevel'], ['year'], ['status']];
  const active = { category: null, governmentLevel: null, year: null, status: null };

  const allChip = el('button', 'be-chip', 'All Files');
  allChip.setAttribute('aria-pressed', 'true');
  allChip.addEventListener('click', () => {
    active.category = active.governmentLevel = active.year = active.status = null;
    host.querySelectorAll('.be-chip').forEach((c) => c.setAttribute('aria-pressed', c === allChip ? 'true' : 'false'));
    onChange(active);
  });
  host.appendChild(allChip);

  for (const [key] of facets) {
    const values = [...new Set(cases.map((c) => c[key]).filter(hasValue))].sort();
    for (const val of values) {
      const chip = el('button', 'be-chip', String(val));
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        const now = active[key] === val ? null : val;
        active[key] = now;
        chip.setAttribute('aria-pressed', now ? 'true' : 'false');
        allChip.setAttribute('aria-pressed', (!active.category && !active.governmentLevel && !active.year && !active.status) ? 'true' : 'false');
        onChange(active);
      });
      host.appendChild(chip);
    }
  }
}

function applyFilters(cases, active) {
  return cases.filter((c) =>
    (!active.category || c.category === active.category) &&
    (!active.governmentLevel || c.governmentLevel === active.governmentLevel) &&
    (!active.year || c.year === active.year) &&
    (!active.status || c.status === active.status));
}

function renderGrid(cases) {
  const grid = document.getElementById('be-archive-grid');
  const count = document.getElementById('archive-count');
  if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');
  if (!grid) return;
  grid.innerHTML = '';
  if (!cases.length) {
    const empty = el('div', 'be-empty');
    empty.appendChild(el('div', 'bee-title', 'No files match'));
    empty.appendChild(el('p', null, 'Adjust the filters, or check back as the Department slowly files more of the public record.'));
    grid.appendChild(empty);
    grid.style.display = 'block';
    return;
  }
  grid.style.display = '';
  cases.forEach((c) => grid.appendChild(caseCard(c)));
}

function renderBulletins(bulletins) {
  const host = document.getElementById('be-bulletins');
  if (!host) return;
  host.innerHTML = '';
  if (!bulletins.length) {
    // Bulletins ship with the site; an empty host only happens if the data file
    // fails to load. Keep the message neutral, never "prototype / none filed yet".
    const empty = el('div', 'be-empty');
    empty.appendChild(el('div', 'bee-title', 'Bulletins are temporarily unavailable'));
    empty.appendChild(el('p', null, 'The bulletin file could not be loaded. Serve this portal over http (npm run serve).'));
    host.appendChild(empty);
    return;
  }
  bulletins.forEach((b) => host.appendChild(bulletin(b)));
}

// =====================================================================
// BOOT
// =====================================================================
function loadedAnim() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
}

async function main() {
  // Editorial content only. Development fixtures live in tests, never here.
  let cases = await loadJson('./data/belgian-cases.json', []);
  let bulletins = await loadJson('./data/belgian-bulletins.json', []);
  if (!Array.isArray(cases)) cases = [];
  if (!Array.isArray(bulletins)) bulletins = [];
  cases = cases.filter((c) => c && c.sample !== true);
  bulletins = bulletins.filter((b) => b && b.sample !== true);

  const archiveView = document.getElementById('be-archive-view');
  const caseView = document.getElementById('be-case-view');

  if (caseParam) {
    const found = cases.find((c) => c.caseNumber === caseParam);
    if (archiveView) archiveView.style.display = 'none';
    if (caseView) caseView.style.display = '';
    if (found) {
      mount('be-case-detail', caseDetail(found));
      document.title = `${found.caseNumber} ${found.title} - Belgian Desk - DBD`;
    } else {
      const nf = el('div', 'be-empty');
      nf.appendChild(el('div', 'bee-title', 'File not found'));
      nf.appendChild(el('p', null, 'No published case matches ' + caseParam + '.'));
      mount('be-case-detail', nf);
    }
  } else {
    buildFilters(cases, (active) => renderGrid(applyFilters(cases, active)));
    renderGrid(cases);
    renderBulletins(bulletins);
  }
  loadedAnim();
}

document.addEventListener('DOMContentLoaded', main);

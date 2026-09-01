/* European Union Desk - data-driven renderer (read-only, no backend).
   Imports the shared EU library so validation/formatting matches the tests.
   Renders the archive and full case dossiers: money (classified), people
   (status-precise), Who Knows Who (evidence-based network), investigation
   tracker, current-status box, aftermath, source ledger, and John's satire.
   Never fabricates. No development samples are loaded here. */

import {
  validateCase, renderableEdges, sourceMap, formatAmount, formatDate, hasValue, NOT_DOCUMENTED,
} from './lib/eu.js';

const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function svg(tag, attrs) { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
function link(href, text, cls) { const a = el('a', cls, text || href); a.href = href; a.rel = 'noopener noreferrer'; a.target = '_blank'; return a; }
function mount(id, node) { const h = document.getElementById(id); if (h) { h.innerHTML = ''; if (node) h.appendChild(node); } }
function sub(t) { return el('div', 'sub-h', t); }

const params = new URLSearchParams(location.search);
const caseParam = params.get('case');

async function loadJson(path, fb) {
  try { const r = await fetch(path, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; }
}

// ---- money headline (always labelled by classification) ----
const MONEY_PRIORITY = [
  'SEIZED CASH', 'COURT-ESTABLISHED LOSS', 'ESTABLISHED IRREGULARITY', 'AMOUNT RECOVERED',
  'ALLEGED BRIBE', 'ALLEGED PAYMENT', 'CONTRACT VALUE', 'EU FUNDING', 'AMOUNT CLAIMED',
  'ESTIMATED FRAUD', 'PUBLIC EXPENDITURE', 'DECLARED BENEFIT', 'EXPENSE', 'OTHER',
];
function headlineMoney(c) {
  const list = Array.isArray(c.money) ? c.money : [];
  for (const cls of MONEY_PRIORITY) {
    const m = list.find((x) => x.classification === cls && typeof x.amount === 'number');
    if (m) return { label: cls, value: formatAmount(m.amount, m.currency) };
  }
  return null;
}
function classSlug(cls) {
  if (cls === 'SEIZED CASH') return 'seized';
  if (cls === 'COURT-ESTABLISHED LOSS') return 'loss';
  if (cls === 'ESTIMATED FRAUD') return 'fraud';
  if (cls.startsWith('ALLEGED')) return 'alleged';
  if (cls === 'AMOUNT RECOVERED') return 'recovered';
  return '';
}
function statusSlug(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('convicted')) return 'convicted';
  if (l.includes('acquit')) return 'acquitted';
  if (l.includes('dismiss')) return 'dismissed';
  if (l.includes('closed')) return 'closed';
  if (l.includes('trial')) return 'trial';
  if (l.includes('pre-trial')) return 'pre-trial';
  if (l.includes('appeal')) return 'appeal';
  if (l.includes('immunity')) return 'immunity';
  if (l.includes('disciplinary')) return 'disciplinary';
  if (l.includes('ongoing')) return 'ongoing';
  return 'unclear';
}

function editorialNotice() {
  const w = el('section', 'editorial-notice');
  w.appendChild(el('span', 'en-badge', 'Editorial Notice'));
  const p = el('p');
  p.appendChild(document.createTextNode('Public-record satire. Factual statements are sourced and dated. '));
  p.appendChild(el('strong', null, 'Investigated is not guilty; alleged is not proven. Courts and investigators make findings. John supplies the satire.'));
  w.appendChild(p);
  return w;
}
function approved(small) {
  const s = el('span', 'stamp eu-approved' + (small ? ' small' : ''));
  s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'APPROVED');
  s.appendChild(el('span', 'stamp-main', 'Approved'));
  return s;
}
function sourceStatus() { return el('span', 'source-status', 'Verified Public Record'); }

// =====================================================================
// ARCHIVE CARD
// =====================================================================
function euCard(c) {
  const card = el('article', 'eu-card');
  card.appendChild(el('div', 'ec-spine'));
  const head = el('div', 'ec-head');
  head.appendChild(el('span', 'ec-no', c.caseNumber));
  head.appendChild(el('span', 'ec-cat', c.category || 'EU'));
  card.appendChild(head);
  const title = el('h3', 'ec-title');
  title.appendChild(link('./eu-desk.html?case=' + encodeURIComponent(c.caseNumber), c.title, null));
  card.appendChild(title);
  if (hasValue(c.subtitle)) card.appendChild(el('div', 'ec-cat', c.subtitle));

  const hm = headlineMoney(c);
  if (hm) {
    const box = el('div', 'ec-money');
    box.appendChild(el('div', 'k', hm.label));
    box.appendChild(el('div', 'v', hm.value));
    card.appendChild(box);
  }
  if (c.currentStatus && hasValue(c.currentStatus.statusLabel)) {
    const p = el('div'); p.style.margin = '8px 0';
    p.appendChild(el('span', 'status-pill ' + statusSlug(c.currentStatus.statusLabel), c.currentStatus.statusLabel));
    card.appendChild(p);
  }
  const foot = el('div', 'ec-foot');
  foot.appendChild(sourceStatus());
  foot.appendChild(approved(true));
  card.appendChild(foot);
  return card;
}

// =====================================================================
// CURRENT STATUS BOX
// =====================================================================
function statusBox(cs) {
  const box = el('section', 'status-box');
  box.appendChild(el('div', 'sb-title', 'Where is this case now?'));
  const grid = el('div', 'sb-grid');
  const cell = (k, v, pill) => { const d = el('div', 'sb-cell'); d.appendChild(el('div', 'k', k)); if (pill) { const s = el('span', 'status-pill ' + statusSlug(v), v); d.appendChild(s); } else d.appendChild(el('div', 'v', v)); grid.appendChild(d); };
  if (hasValue(cs.statusLabel)) cell('Current status', cs.statusLabel, true);
  if (hasValue(cs.lastProceduralEvent)) cell('Last procedural event', cs.lastProceduralEvent);
  if (hasValue(cs.date)) cell('Date', formatDate(cs.date) || cs.date);
  if (hasValue(cs.authority)) cell('Authority', cs.authority);
  if (hasValue(cs.lastVerified)) cell('Last verified', formatDate(cs.lastVerified) || cs.lastVerified);
  box.appendChild(grid);
  return box;
}

// =====================================================================
// MONEY
// =====================================================================
function moneyBlock(list) {
  const wrap = el('div', 'money-record');
  list.forEach((m) => {
    const row = el('div', 'money-row');
    const left = el('div');
    left.appendChild(el('span', 'm-class ' + classSlug(m.classification), m.classification));
    const amt = (m.amount === NOT_DOCUMENTED || typeof m.amount !== 'number')
      ? (() => { const a = el('div', 'm-amount nd', 'NOT DOCUMENTED'); return a; })()
      : el('div', 'm-amount', formatAmount(m.amount, m.currency));
    left.appendChild(amt);
    row.appendChild(left);
    const right = el('div');
    if (hasValue(m.description)) right.appendChild(el('div', 'm-desc', m.description));
    const meta = [];
    if (hasValue(m.recipient)) meta.push('To: ' + m.recipient);
    if (hasValue(m.payer)) meta.push('From: ' + m.payer);
    if (hasValue(m.date)) meta.push(formatDate(m.date) || m.date);
    if (meta.length) right.appendChild(el('div', 'sr-meta', meta.join(' · ')));
    row.appendChild(right);
    wrap.appendChild(row);
  });
  return wrap;
}

// =====================================================================
// PEOPLE
// =====================================================================
function personCard(p) {
  const card = el('article', 'person-card');
  card.appendChild(el('div', 'p-name', p.name));
  const role = [p.publicRole || p.roleAtTime, p.institution].filter(hasValue).join(' · ');
  if (role) card.appendChild(el('div', 'p-role', role));
  if (hasValue(p.proceduralStatus)) {
    const pill = el('div'); pill.style.margin = '4px 0';
    pill.appendChild(el('span', 'status-pill ' + statusSlug(p.proceduralStatus), p.proceduralStatus));
    if (hasValue(p.caseRole)) pill.appendChild(document.createTextNode(' '));
    card.appendChild(pill);
  }
  const alleg = Array.isArray(p.allegations) ? p.allegations.filter(hasValue) : [];
  if (alleg.length) {
    const d = el('div', 'p-alleged'); d.appendChild(el('div', 'p-line', 'Alleged (not proven)'));
    alleg.forEach((a) => d.appendChild(el('div', null, a))); card.appendChild(d);
  }
  const est = Array.isArray(p.establishedFindings) ? p.establishedFindings.filter(hasValue) : [];
  if (est.length) {
    const d = el('div', 'p-established'); d.appendChild(el('div', 'p-line', 'Established finding'));
    est.forEach((a) => d.appendChild(el('div', null, a))); card.appendChild(d);
  }
  if (hasValue(p.currentStatus)) card.appendChild(el('div', 'p-role', p.currentStatus));
  const foot = el('div', 'p-foot');
  foot.appendChild(el('span', 'p-verified', hasValue(p.lastVerified) ? 'Last verified ' + (formatDate(p.lastVerified) || p.lastVerified) : ''));
  card.appendChild(foot);
  return card;
}

// =====================================================================
// WHO KNOWS WHO — evidence-based network
// =====================================================================
function whoKnowsWho(network, srcMap) {
  const edges = renderableEdges(network);
  const wrap = el('div', 'wkw');
  if (!edges.length) {
    const note = el('div', 'wkw-note', 'No sourced relationships have been recorded for this file yet. A connection is only shown when it has documented evidence.');
    wrap.appendChild(note);
    return wrap;
  }
  const nodes = Array.isArray(network.nodes) ? network.nodes : [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  // Deterministic circular layout with generous padding so labels never clip.
  const W = 700, H = Math.max(460, 300 + nodes.length * 16);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 120;
  const pos = new Map();
  nodes.forEach((n, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI / Math.max(1, nodes.length));
    pos.set(n.id, { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) });
  });

  const board = el('div', 'wkw-board');
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Documented relationship map' });

  const detail = el('div', 'wkw-detail');
  detail.appendChild(el('span', 'd-empty', 'Tap any connection to see the evidence behind it.'));
  const showEdge = (e, lineNode) => {
    s.querySelectorAll('.edge').forEach((l) => l.classList.remove('active'));
    lineNode.classList.add('active');
    detail.innerHTML = '';
    const a = nodeById.get(e.from), b = nodeById.get(e.to);
    detail.appendChild(el('div', 'd-rel', `${(a && a.label) || e.from}  —[ ${e.relationshipType} ]→  ${(b && b.label) || e.to}`));
    if (hasValue(e.description)) detail.appendChild(el('div', null, e.description));
    const meta = [];
    if (hasValue(e.sourceDate)) meta.push('Dated ' + (formatDate(e.sourceDate) || e.sourceDate));
    if (meta.length) detail.appendChild(el('div', 'sr-meta', meta.join(' · ')));
    (e.sourceIds || []).forEach((id) => { const src = srcMap.get(id); if (src && src.sourceURL) detail.appendChild(link(src.sourceURL, 'Source: ' + (src.title || src.institution || src.sourceURL))); });
    if (hasValue(e.sourceURL)) detail.appendChild(link(e.sourceURL, 'Source: ' + e.sourceURL));
  };

  // edges first (under nodes)
  edges.forEach((e) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return;
    const line = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge' });
    const hit = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge-hit' });
    const onSel = () => showEdge(e, line);
    hit.addEventListener('click', onSel);
    line.addEventListener('click', onSel);
    s.appendChild(line); s.appendChild(hit);
    // edge label at midpoint, with a paper background for legibility
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const label = e.relationshipType;
    const w = label.length * 5.4 + 8;
    s.appendChild(svg('rect', { x: mx - w / 2, y: my - 11, width: w, height: 13, rx: 2, class: 'edge-label-bg' }));
    const lbl = svg('text', { x: mx, y: my - 1, 'text-anchor': 'middle', class: 'edge-label' });
    lbl.textContent = label;
    s.appendChild(lbl);
  });
  // nodes (labels placed outside the ring: below for lower half, above for upper)
  nodes.forEach((n) => {
    const p = pos.get(n.id); if (!p) return;
    const g = svg('g', { class: 'node ' + (n.nodeType || 'other').toLowerCase().replace(/[^a-z]+/g, '-') });
    g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 9 }));
    const below = p.y > cy + 4;
    const t = svg('text', { x: p.x, y: below ? p.y + 22 : p.y - 15, 'text-anchor': 'middle' });
    t.textContent = n.label;
    g.appendChild(t);
    s.appendChild(g);
  });

  board.appendChild(s);
  wrap.appendChild(board);
  wrap.appendChild(detail);

  // legend of node types present
  const types = [...new Set(nodes.map((n) => n.nodeType).filter(hasValue))];
  if (types.length) {
    const legend = el('div', 'wkw-legend');
    types.forEach((t) => legend.appendChild(el('span', null, '● ' + t)));
    wrap.appendChild(legend);
  }
  wrap.appendChild(el('div', 'wkw-note', 'A line means only what its label says. A connection is not an accusation. Every edge shown here has a documented source; tap it to read the evidence.'));
  return wrap;
}

// =====================================================================
// investigation / timeline / sources / aftermath
// =====================================================================
function investigationTracker(list) {
  const ul = el('ul', 'investigation');
  list.forEach((ev) => {
    const li = el('li');
    if (hasValue(ev.date)) li.appendChild(el('span', 'iv-date', (formatDate(ev.date) || ev.date) + '  '));
    if (hasValue(ev.authority)) li.appendChild(el('span', 'iv-auth', ev.authority));
    const parts = [ev.event, ev.person, ev.status].filter(hasValue).join(' · ');
    li.appendChild(el('div', 'iv-event', parts));
    ul.appendChild(li);
  });
  return ul;
}
function timeline(list) {
  const ul = el('ul', 'case-timeline');
  list.forEach((it) => { const li = el('li'); if (hasValue(it.date)) li.appendChild(el('div', 'tl-date', formatDate(it.date) || it.date)); li.appendChild(el('div', 'tl-event', it.event || '')); ul.appendChild(li); });
  return ul;
}
function aftermath(list) {
  const wrap = el('div');
  list.forEach((a) => {
    const row = el('div', 'who-row');
    row.appendChild(el('span', 'who-name', a.person || ''));
    const d = [a.development, hasValue(a.date) ? '(' + (formatDate(a.date) || a.date) + ')' : ''].filter(hasValue).join(' ');
    row.appendChild(el('span', 'who-role', d));
    wrap.appendChild(row);
  });
  return wrap;
}
function sourceRecord(s) {
  const rec = el('div', 'source-record' + (s.primaryOrSecondary === 'PRIMARY' ? ' is-primary' : ''));
  const line = el('div');
  if (s.primaryOrSecondary === 'PRIMARY') line.appendChild(el('span', 'sr-primary', 'Primary'));
  if (hasValue(s.sourceType)) line.appendChild(el('span', 'sr-type', s.sourceType));
  line.appendChild(el('span', 'sr-name', s.institution || s.title || 'Source'));
  rec.appendChild(line);
  if (hasValue(s.title)) rec.appendChild(el('div', 'sr-meta', s.title));
  if (hasValue(s.sourceURL)) rec.appendChild(link(s.sourceURL, s.sourceURL));
  const meta = [];
  if (hasValue(s.publicationDate)) meta.push('Published ' + (formatDate(s.publicationDate) || s.publicationDate));
  if (hasValue(s.accessDate)) meta.push('Accessed ' + (formatDate(s.accessDate) || s.accessDate));
  if (hasValue(s.language)) meta.push(String(s.language).toUpperCase());
  if (meta.length) rec.appendChild(el('div', 'sr-meta', meta.join(' · ')));
  return rec;
}
function clerkAssessment(a) {
  const wrap = el('div', 'clerk-assessment');
  const rows = [
    ['administrativeAmbition', 'Administrative Ambition'],
    ['financialJudgement', 'Financial Judgement'],
    ['paperworkGenerated', 'Paperwork Generated'],
    ['accountabilityStatus', 'Accountability'],
    ['lessonsLearned', 'Lessons Learned'],
    ['departmentVerdict', 'Department Verdict'],
  ];
  let any = false;
  for (const [k, label] of rows) { if (!hasValue(a[k])) continue; const r = el('div', 'ca-row'); r.appendChild(el('div', 'ca-k', label)); r.appendChild(el('div', 'ca-v', a[k])); wrap.appendChild(r); any = true; }
  return any ? wrap : null;
}

// =====================================================================
// CASE DETAIL
// =====================================================================
function caseDetail(c) {
  const srcMap = sourceMap(c.sources);
  const root = el('div');

  // header
  const header = el('section', 'gov-form');
  const fh = el('div', 'form-head');
  const left = el('div', 'fh-left');
  left.appendChild(el('div', 'fh-id', c.caseNumber + ' · European Union Desk'));
  left.appendChild(el('div', 'fh-title', c.title || 'Untitled'));
  if (hasValue(c.subtitle)) left.appendChild(el('div', 'ec-cat', c.subtitle));
  fh.appendChild(left);
  const meta = el('div', 'fh-meta');
  [].concat(c.institutions || [], [c.category]).filter(hasValue).forEach((b) => meta.appendChild(el('div', null, b)));
  fh.appendChild(meta);
  header.appendChild(fh);
  const hb = el('div', 'form-body'); hb.appendChild(sourceStatus()); header.appendChild(hb);
  root.appendChild(header);

  root.appendChild(editorialNotice());

  // WHERE IS THIS CASE NOW (prominent, near top)
  if (c.currentStatus) root.appendChild(statusBox(c.currentStatus));

  // Fact layer
  const fact = el('section', 'layer layer-fact');
  fact.appendChild(el('span', 'layer-label', 'The Record · Sourced'));
  if (hasValue(c.executiveSummary)) { fact.appendChild(sub('Executive summary')); fact.appendChild(el('p', null, c.executiveSummary)); }
  if (hasValue(c.whatIsEstablished)) { fact.appendChild(sub('What is established')); fact.appendChild(el('p', null, c.whatIsEstablished)); }
  root.appendChild(fact);

  // Alleged layer (clearly separated)
  if (hasValue(c.whatIsAlleged)) {
    const al = el('section', 'layer layer-alleged');
    al.appendChild(el('span', 'layer-label', 'What is alleged · not proven'));
    al.appendChild(el('p', null, c.whatIsAlleged));
    root.appendChild(al);
  }

  // The Money
  if (Array.isArray(c.money) && c.money.length) {
    const sec = el('section', 'eu-section');
    sec.appendChild(el('div', 'eu-section-head', '')).appendChild(el('h2', null, 'The Money'));
    sec.appendChild(el('p', 'sr-meta', 'Every amount is labelled by what it actually represents. A seizure is not a proven bribe; an allegation is not a payment.'));
    sec.appendChild(moneyBlock(c.money));
    root.appendChild(sec);
  }

  // The People
  if (Array.isArray(c.people) && c.people.length) {
    const sec = el('section', 'eu-section');
    const h = el('div', 'eu-section-head'); h.appendChild(el('h2', null, 'The People')); sec.appendChild(h);
    const grid = el('div', 'people-grid');
    c.people.forEach((p) => grid.appendChild(personCard(p)));
    sec.appendChild(grid);
    root.appendChild(sec);
  }

  // Who Knows Who
  if (c.network && Array.isArray(c.network.edges) && renderableEdges(c.network).length) {
    const sec = el('section', 'eu-section');
    const h = el('div', 'eu-section-head'); h.appendChild(el('h2', null, 'Who Knows Who?')); h.appendChild(el('span', 'esh-meta', 'Documented relationships only')); sec.appendChild(h);
    sec.appendChild(whoKnowsWho(c.network, srcMap));
    root.appendChild(sec);
  }

  // Investigation
  if (Array.isArray(c.investigation) && c.investigation.length) {
    const sec = el('section', 'eu-section');
    const h = el('div', 'eu-section-head'); h.appendChild(el('h2', null, 'The Investigation')); sec.appendChild(h);
    sec.appendChild(investigationTracker(c.investigation));
    root.appendChild(sec);
  }

  // Timeline
  if (Array.isArray(c.timeline) && c.timeline.length) {
    const sec = el('section', 'eu-section');
    const h = el('div', 'eu-section-head'); h.appendChild(el('h2', null, 'Timeline')); sec.appendChild(h);
    sec.appendChild(timeline(c.timeline));
    root.appendChild(sec);
  }

  // What happened next
  if (Array.isArray(c.whatHappenedNext) && c.whatHappenedNext.length) {
    const sec = el('section', 'eu-section');
    const h = el('div', 'eu-section-head'); h.appendChild(el('h2', null, 'What Happened Next?')); sec.appendChild(h);
    sec.appendChild(aftermath(c.whatHappenedNext));
    root.appendChild(sec);
  }

  // Source file
  const sf = el('section', 'eu-section');
  const sh = el('div', 'eu-section-head'); sh.appendChild(el('h2', null, 'Source File')); sh.appendChild(el('span', 'esh-meta', 'Primary sources highlighted')); sf.appendChild(sh);
  if (Array.isArray(c.sources) && c.sources.length) c.sources.forEach((s) => sf.appendChild(sourceRecord(s)));
  else sf.appendChild(el('p', null, 'No sources attached.'));
  root.appendChild(sf);

  // John's assessment (satire)
  const ca = clerkAssessment(c.clerkAssessment || {});
  if (ca || hasValue(c.johnNotes)) {
    const satire = el('section', 'layer layer-satire');
    satire.appendChild(el('span', 'layer-label', "John's Assessment · Editorial Satire"));
    if (ca) satire.appendChild(ca);
    if (hasValue(c.johnNotes)) satire.appendChild(el('p', null, c.johnNotes));
    satire.appendChild(el('div', 'satire-note', 'John reads the paperwork; he does not make criminal findings. This block is satire, not a legal conclusion.'));
    const sw = el('div'); sw.style.marginTop = '14px'; sw.appendChild(approved(false));
    satire.appendChild(sw);
    root.appendChild(satire);
  }
  return root;
}

// =====================================================================
// BOOT
// =====================================================================
function loadedAnim() { requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded'))); }

async function main() {
  let cases = await loadJson('./data/eu-cases.json', []);
  if (!Array.isArray(cases)) cases = [];
  cases = cases.filter((c) => c && c.sample !== true && validateCase(c).ok);

  const archiveView = document.getElementById('eu-archive-view');
  const caseView = document.getElementById('eu-case-view');

  if (caseParam) {
    const found = cases.find((c) => c.caseNumber === caseParam);
    if (archiveView) archiveView.style.display = 'none';
    if (caseView) caseView.style.display = '';
    if (found) { mount('eu-case-detail', caseDetail(found)); document.title = `${found.caseNumber} ${found.title} - EU Desk - DBD`; }
    else { const nf = el('div', 'eu-empty'); nf.appendChild(el('div', 'eue-title', 'File not found')); nf.appendChild(el('p', null, 'No published case matches ' + caseParam + '.')); mount('eu-case-detail', nf); }
  } else {
    const grid = document.getElementById('eu-archive-grid');
    const count = document.getElementById('eu-archive-count');
    if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');
    if (grid) {
      grid.innerHTML = '';
      if (!cases.length) {
        const empty = el('div', 'eu-empty');
        empty.appendChild(el('div', 'eue-title', 'No files published yet'));
        empty.appendChild(el('p', null, 'EU case files appear here only when fully researched, sourced and status-dated.'));
        grid.appendChild(empty);
      } else cases.forEach((c) => grid.appendChild(euCard(c)));
    }
  }
  loadedAnim();
}

document.addEventListener('DOMContentLoaded', main);

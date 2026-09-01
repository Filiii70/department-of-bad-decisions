/* Homepage "Files currently under review" - loads real, sourced Belgian cases
   from the same data as the Belgian Desk. Read-only, no backend. No development
   samples are ever loaded here; the homepage shows production editorial content. */

import { formatAmount, hasValue, NOT_DOCUMENTED, validateCase } from './lib/belgian.js';

const MAX_HOME = 4;

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

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

async function loadJson(path, fb) {
  try { const r = await fetch(path, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; }
}

function keyMoney(c) {
  const m = c.publicMoney; if (!m) return null;
  for (const [k, label] of KEY_ORDER) {
    const f = formatAmount(m[k], m.currency);
    if (f && m[k] !== NOT_DOCUMENTED) return { label, value: f };
  }
  return null;
}

function homeCard(c) {
  const card = el('article', 'home-file');
  card.appendChild(el('span', 'hf-tag', c.status || 'Under Review'));
  card.appendChild(el('span', 'hf-no', c.caseNumber));

  const title = el('h3', 'hf-title');
  const a = el('a', null, c.title || 'Untitled');
  a.href = './belgian-desk.html?case=' + encodeURIComponent(c.caseNumber);
  title.appendChild(a);
  card.appendChild(title);

  if (hasValue(c.institution)) { card.appendChild(el('div', 'hf-k', 'Institution')); card.appendChild(el('div', 'hf-v', c.institution)); }

  const km = keyMoney(c);
  card.appendChild(el('div', 'hf-k', km ? km.label : 'Public money'));
  if (km) card.appendChild(el('div', 'hf-money', km.value));
  else card.appendChild(el('div', 'hf-money nd', 'NOT DOCUMENTED'));

  const intended = c.originalPlan || c.intended;
  if (hasValue(intended)) { card.appendChild(el('div', 'hf-k', 'What was supposed to happen')); card.appendChild(el('div', 'hf-v', intended)); }
  if (hasValue(c.actual)) { card.appendChild(el('div', 'hf-k', 'What actually happened')); card.appendChild(el('div', 'hf-v', c.actual)); }

  const verdict = c.clerkAssessment && (c.clerkAssessment.departmentVerdict || c.clerkAssessment.financialJudgement);
  if (verdict) { card.appendChild(el('div', 'hf-k', "Clerk's assessment (satire)")); card.appendChild(el('div', 'hf-v', verdict)); }

  const foot = el('div', 'hf-foot');
  foot.appendChild(el('span', 'source-status', 'Verified Public Record'));
  const stamp = el('span', 'stamp be-approved small');
  stamp.setAttribute('role', 'img'); stamp.setAttribute('aria-label', 'APPROVED');
  stamp.appendChild(el('span', 'stamp-main', 'Approved'));
  foot.appendChild(stamp);
  card.appendChild(foot);
  return card;
}

async function main() {
  const grid = document.getElementById('home-files');
  if (!grid) return;
  let cases = await loadJson('./data/belgian-cases.json', []);
  if (!Array.isArray(cases)) cases = [];
  cases = cases.filter((c) => c && c.sample !== true && validateCase(c).ok).slice(0, MAX_HOME);

  const count = document.getElementById('home-files-count');
  grid.innerHTML = '';
  if (!cases.length) {
    if (count) count.textContent = '0 files';
    const empty = el('div', 'be-empty');
    empty.appendChild(el('div', 'bee-title', 'No files published yet'));
    empty.appendChild(el('p', null, 'Documented cases appear here once verified against public sources.'));
    grid.appendChild(empty);
    grid.style.display = 'block';
    return;
  }
  if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');
  cases.forEach((c) => grid.appendChild(homeCard(c)));
}

document.addEventListener('DOMContentLoaded', main);

/* Homepage "Files currently under review" — features the current EU Desk case
   files (Qatargate, Huaweigate) on the front door. Read-only, no backend.
   No development samples are ever loaded here. Cards link into the EU Desk. */

import { hasValue, validateCase } from './lib/eu.js';

const MAX_HOME = 4;

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

async function loadJson(path, fb) {
  try { const r = await fetch(path, { cache: 'no-store' }); return r.ok ? await r.json() : fb; } catch { return fb; }
}

function money(c) {
  if (c.citizen && c.citizen.money && hasValue(c.citizen.money.figure)) return c.citizen.money;
  return null;
}

function homeCard(c) {
  const card = el('article', 'home-file');
  card.appendChild(el('span', 'hf-tag', (c.currentStatus && c.currentStatus.statusLabel) || c.category || 'Under review'));
  card.appendChild(el('span', 'hf-no', c.caseNumber));

  const title = el('h3', 'hf-title');
  const a = el('a', null, c.title || 'Untitled');
  a.href = './eu-desk.html?case=' + encodeURIComponent(c.caseNumber);
  title.appendChild(a);
  card.appendChild(title);

  if (Array.isArray(c.institutions) && c.institutions.length) {
    card.appendChild(el('div', 'hf-k', 'Institution'));
    card.appendChild(el('div', 'hf-v', c.institutions[0]));
  }

  const m = money(c);
  card.appendChild(el('div', 'hf-k', m ? m.label : 'The money'));
  if (m) card.appendChild(el('div', 'hf-money', m.figure));
  else card.appendChild(el('div', 'hf-money nd', 'See file'));

  if (hasValue(c.subtitle)) { card.appendChild(el('div', 'hf-k', 'In plain English')); card.appendChild(el('div', 'hf-v', c.subtitle)); }

  const john = c.citizen && c.citizen.johnLine;
  if (hasValue(john)) { card.appendChild(el('div', 'hf-k', 'John (satire)')); card.appendChild(el('div', 'hf-v', john)); }

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
    grid.style.display = 'block';
    return;
  }
  if (count) count.textContent = cases.length + (cases.length === 1 ? ' file' : ' files');
  cases.forEach((c) => grid.appendChild(homeCard(c)));
}

document.addEventListener('DOMContentLoaded', main);

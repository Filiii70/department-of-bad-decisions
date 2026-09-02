/* Regression coverage for Belgian Desk content maturity.
   Validates the BUILT data and renderer so the Belgian Desk cannot silently fall
   back to a thin / prototype state: at least 6 substantial files, at least 3
   bulletins, unique IDs, every file has a status, every money figure is
   classified with context, sources are populated, and the Oosterweel file no
   longer exposes an unqualified ~10bn "Cost Estimate". */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCase, validateBulletin } from '../site/scripts/lib/belgian.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'site', 'dist');

function build() {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
}
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('Belgian Desk ships at least 6 substantial, valid, unique full files', () => {
  build();
  const cases = readJson(join(DIST, 'data', 'belgian-cases.json'));
  assert.ok(Array.isArray(cases), 'belgian-cases.json is not an array');
  assert.ok(cases.length >= 6, `expected >= 6 Belgian files, found ${cases.length}`);
  const ids = new Set();
  for (const c of cases) {
    assert.notEqual(c.sample, true, `production case ${c.caseNumber} is flagged sample`);
    assert.equal(validateCase(c).ok, true, `invalid case ${c.caseNumber}: ${validateCase(c).errors.join('; ')}`);
    assert.ok(!ids.has(c.caseNumber), `duplicate case id ${c.caseNumber}`);
    ids.add(c.caseNumber);
    assert.ok(c.status && String(c.status).length > 0, `case ${c.caseNumber} has no status`);
    assert.ok(Array.isArray(c.sources) && c.sources.length > 0, `case ${c.caseNumber} has no sources`);
  }
});

test('every documented money figure carries a classification and context', () => {
  build();
  const cases = readJson(join(DIST, 'data', 'belgian-cases.json'));
  for (const c of cases) {
    const figs = (c.publicMoney && c.publicMoney.figures) || [];
    for (const f of figs) {
      assert.ok(f.classification && String(f.classification).length > 0,
        `case ${c.caseNumber} has a money figure "${f.label}" without a classification`);
      // Non-NOT_DOCUMENTED figures must say what they represent (and, where relevant, a period).
      if (f.amount !== 'NOT_DOCUMENTED') {
        assert.ok(f.represents && String(f.represents).length > 0,
          `case ${c.caseNumber} figure "${f.label}" does not say what the amount represents`);
      }
    }
  }
});

test('Oosterweel no longer exposes an unqualified ~10bn Cost Estimate', () => {
  build();
  const cases = readJson(join(DIST, 'data', 'belgian-cases.json'));
  const oost = cases.find((c) => c.caseNumber === 'DBD-BE-0001');
  assert.ok(oost, 'DBD-BE-0001 (Oosterweel) is missing');
  const m = oost.publicMoney || {};
  // The old unqualified keyed figure must be gone; a precise, classified figures[] must be present.
  assert.equal(m.currentEstimate, undefined, 'Oosterweel still has an unqualified currentEstimate key');
  assert.ok(Array.isArray(m.figures) && m.figures.length >= 2, 'Oosterweel must present classified figures[]');
  const construction = m.figures.find((f) => f.amount === 10000000000);
  assert.ok(construction, 'Oosterweel 10bn figure missing');
  assert.match(construction.classification, /construction cost/i, '10bn figure is not classified as a construction cost');
  assert.match(String(construction.asOf || ''), /price level|2024/i, '10bn figure lacks its price-level / date context');
});

test('Belgian Desk ships at least 3 valid, unique bulletins', () => {
  build();
  const bs = readJson(join(DIST, 'data', 'belgian-bulletins.json'));
  assert.ok(Array.isArray(bs), 'belgian-bulletins.json is not an array');
  assert.ok(bs.length >= 3, `expected >= 3 bulletins, found ${bs.length}`);
  const ids = new Set();
  for (const b of bs) {
    assert.notEqual(b.sample, true, `production bulletin ${b.caseNumber} is flagged sample`);
    assert.equal(validateBulletin(b).ok, true, `invalid bulletin ${b.caseNumber}: ${validateBulletin(b).errors.join('; ')}`);
    assert.ok(!ids.has(b.caseNumber), `duplicate bulletin id ${b.caseNumber}`);
    ids.add(b.caseNumber);
    assert.ok(Array.isArray(b.sources) && b.sources.length > 0, `bulletin ${b.caseNumber} has no sources`);
  }
});

test('meaningful regional spread across Belgian public life', () => {
  build();
  const cases = readJson(join(DIST, 'data', 'belgian-cases.json'));
  const levels = new Set(cases.map((c) => c.governmentLevel));
  // At least three distinct government levels represented (e.g. FEDERAL + a region or two).
  assert.ok(levels.size >= 3, `expected >= 3 distinct government levels, found ${[...levels].join(', ')}`);
});

test('prototype / empty-state copy is gone from the Belgian renderer', () => {
  build();
  const js = readFileSync(join(DIST, 'scripts', 'belgian-desk.js'), 'utf8');
  assert.doesNotMatch(js, /No bulletins on file/, 'prototype "No bulletins on file" copy is still present');
  assert.doesNotMatch(js, /approved artwork pending/, 'placeholder "approved artwork pending" copy is still present');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateCase, validateBulletin, formatAmount, CATEGORIES, SOURCE_TYPES,
  CASE_NUMBER_RE, NOT_DOCUMENTED,
} from '../site/scripts/lib/belgian.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'site', 'src', 'data');
const FIXTURES = join(__dirname, 'fixtures');

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }

test('validateCase enforces case number format and sourced facts', () => {
  const bad = validateCase({ caseNumber: 'BE-1', title: 'x', summary: 'a fact' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.includes('caseNumber')));
  assert.ok(bad.errors.some((e) => e.includes('facts must be sourced')));

  const good = validateCase({
    caseNumber: 'DBD-BE-0009', title: 'A case', category: 'PUBLIC MONEY',
    summary: 'Something documented happened.',
    sources: [{ sourceName: 'Court of Audit', sourceType: 'COURT OF AUDIT', sourceURL: 'https://ccrek.be/report' }],
  });
  assert.equal(good.ok, true, good.errors.join('; '));
});

test('a case with no factual content needs no source', () => {
  const r = validateCase({ caseNumber: 'DBD-BE-0010', title: 'Placeholder-free stub' });
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('validateBulletin checks number format', () => {
  assert.equal(validateBulletin({ caseNumber: 'DBD-BE-B-0001', subject: 'x' }).ok, true);
  assert.equal(validateBulletin({ caseNumber: 'DBD-BE-0001', subject: 'x' }).ok, false);
});

test('formatAmount formats euros and respects NOT_DOCUMENTED', () => {
  assert.equal(formatAmount(3400000), '€3,400,000');
  assert.equal(formatAmount(NOT_DOCUMENTED), 'NOT DOCUMENTED');
  assert.equal(formatAmount('nope'), null);
  assert.equal(formatAmount(undefined), null);
});

test('PRODUCTION belgian-cases.json contains no invented / sample cases', () => {
  const cases = readJson(join(DATA, 'belgian-cases.json'));
  assert.ok(Array.isArray(cases));
  for (const c of cases) {
    assert.notEqual(c.sample, true, `production case ${c.caseNumber} is flagged sample`);
    const v = validateCase(c);
    assert.equal(v.ok, true, `invalid production case: ${v.errors.join('; ')}`);
  }
});

test('PRODUCTION belgian-bulletins.json is valid and sample-free', () => {
  const bs = readJson(join(DATA, 'belgian-bulletins.json'));
  assert.ok(Array.isArray(bs));
  for (const b of bs) {
    assert.notEqual(b.sample, true);
    assert.equal(validateBulletin(b).ok, true);
  }
});

test('DEVELOPMENT SAMPLE fixtures are isolated to tests, flagged and valid', () => {
  // Sample fixtures live under tests/fixtures and are NEVER shipped in site data.
  assert.equal(existsSync(join(DATA, 'belgian-cases.sample.json')), false, 'sample data must not live in served site data');
  const sc = readJson(join(FIXTURES, 'belgian-cases.sample.json'));
  assert.ok(sc.length >= 1);
  for (const c of sc) {
    assert.equal(c.sample, true, `sample case ${c.caseNumber} must be flagged sample:true`);
    assert.ok(CASE_NUMBER_RE.test(c.caseNumber));
    assert.equal(validateCase(c).ok, true, JSON.stringify(validateCase(c).errors));
  }
  const sb = readJson(join(FIXTURES, 'belgian-bulletins.sample.json'));
  for (const b of sb) assert.equal(b.sample, true);
});

test('built site does NOT ship development sample data', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
  assert.equal(existsSync(join(ROOT, 'site', 'dist', 'data', 'belgian-cases.sample.json')), false);
  assert.equal(existsSync(join(ROOT, 'site', 'dist', 'data', 'belgian-bulletins.sample.json')), false);
});

test('build produces the Belgian Desk page and data in dist', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
  for (const f of [
    'belgian-desk.html',
    'styles/belgian-desk.css',
    'scripts/belgian-desk.js',
    'scripts/lib/belgian.js',
    'data/belgian-cases.json',
    'data/belgian-bulletins.json',
  ]) {
    assert.ok(existsSync(join(ROOT, 'site', 'dist', f)), 'missing dist file: ' + f);
  }
  const html = readFileSync(join(ROOT, 'site', 'dist', 'belgian-desk.html'), 'utf8');
  assert.match(html, /Belgian Desk combines documented public information with obvious bureaucratic satire/);
  assert.match(html, /belgian-desk\.css/);
  assert.match(html, /belgian-desk\.js/);
});

test('enums are internally consistent', () => {
  assert.ok(CATEGORIES.includes('PUBLIC MONEY'));
  assert.ok(SOURCE_TYPES.includes('COURT OF AUDIT'));
});

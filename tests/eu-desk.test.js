import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateCase, validateMoney, validateEdge, validatePerson, validateInvestigationEvent,
  renderableEdges, EU_CASE_NUMBER_RE, MONEY_CLASSIFICATIONS, PROCEDURAL_STATUS, ESTABLISHED_STATES,
} from '../site/scripts/lib/eu.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'site', 'src', 'data');
const FIXTURES = join(__dirname, 'fixtures');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('money amount requires a classification AND a source', () => {
  assert.ok(validateMoney({ amount: 1000, classification: 'SEIZED CASH', sourceIds: ['S1'] }).length === 0);
  assert.ok(validateMoney({ amount: 1000, sourceIds: ['S1'] }).length > 0); // no classification
  assert.ok(validateMoney({ amount: 1000, classification: 'SEIZED CASH' }).length > 0); // no source
  assert.ok(validateMoney({ amount: 1000, classification: 'MADE UP', sourceIds: ['S1'] }).length > 0); // bad class
});

test('network edge requires a source', () => {
  assert.equal(validateEdge({ from: 'a', to: 'b', relationshipType: 'DECLARED MEETING', sourceIds: ['S1'] }).length, 0);
  assert.equal(validateEdge({ from: 'a', to: 'b', relationshipType: 'DECLARED MEETING', sourceURL: 'https://x.eu/d' }).length, 0);
  assert.ok(validateEdge({ from: 'a', to: 'b', relationshipType: 'DECLARED MEETING' }).length > 0); // no source
  assert.ok(validateEdge({ from: 'a', to: 'b', relationshipType: 'RUMOUR', sourceIds: ['S1'] }).length > 0); // bad type
});

test('renderableEdges drops any edge without a source (never shown in production)', () => {
  const net = { edges: [
    { from: 'a', to: 'b', relationshipType: 'CONTRACT', sourceIds: ['S1'] },
    { from: 'a', to: 'c', relationshipType: 'CONTRACT' },
  ] };
  assert.equal(renderableEdges(net).length, 1);
});

test('a person allegation cannot silently become an established finding', () => {
  const alleged = { name: 'X', proceduralStatus: 'UNDER INVESTIGATION', allegations: ['a'], establishedFindings: [] };
  assert.equal(validatePerson(alleged).length, 0);
  const sneaky = { name: 'X', proceduralStatus: 'UNDER INVESTIGATION', establishedFindings: ['guilty'] };
  assert.ok(validatePerson(sneaky).length > 0, 'establishedFindings without CONVICTED/finding must fail');
  const convicted = { name: 'Y', proceduralStatus: 'CONVICTED', establishedFindings: ['convicted of X'] };
  assert.equal(validatePerson(convicted).length, 0);
});

test('investigation timeline events require a source', () => {
  assert.equal(validateInvestigationEvent({ date: '2024-01-01', authority: 'EPPO', event: 'SEARCH', sourceIds: ['S1'] }).length, 0);
  assert.ok(validateInvestigationEvent({ date: '2024-01-01', authority: 'EPPO', event: 'SEARCH' }).length > 0);
});

test('a case legal status requires lastVerified', () => {
  const base = {
    caseNumber: 'DBD-EU-0009', title: 'T', category: 'MONEY',
    executiveSummary: 'facts', sources: [{ sourceId: 'S1', sourceURL: 'https://x.eu/a', title: 't' }],
  };
  const noStatus = validateCase({ ...base });
  assert.ok(noStatus.ok === false && noStatus.errors.some((e) => e.includes('currentStatus')));
  const noVerified = validateCase({ ...base, currentStatus: { statusLabel: 'ONGOING INVESTIGATION' } });
  assert.ok(noVerified.errors.some((e) => e.includes('lastVerified')));
  const good = validateCase({ ...base, currentStatus: { statusLabel: 'ONGOING INVESTIGATION', lastVerified: '2026-09-01' } });
  assert.equal(good.ok, true, good.errors.join('; '));
});

test('case number format enforced', () => {
  assert.ok(EU_CASE_NUMBER_RE.test('DBD-EU-0001'));
  assert.ok(!EU_CASE_NUMBER_RE.test('DBD-BE-0001'));
});

test('new conviction/audit statuses and money classifications are supported', () => {
  for (const s of ['SENTENCED', 'RESIGNED', 'SANCTIONED', 'AUDIT FINDING', 'CONFLICT OF INTEREST FOUND', 'NO CRIMINAL FINDING DOCUMENTED']) {
    assert.ok(PROCEDURAL_STATUS.includes(s), 'missing status ' + s);
  }
  for (const m of ['COURT-ESTABLISHED BRIBE', 'CONFISCATED', 'AUDIT-QUESTIONED EXPENDITURE']) {
    assert.ok(MONEY_CLASSIFICATIONS.includes(m), 'missing classification ' + m);
  }
  // established findings allowed only for established states
  assert.ok(ESTABLISHED_STATES.includes('SENTENCED') && ESTABLISHED_STATES.includes('CONFLICT OF INTEREST FOUND'));
  assert.equal(validatePerson({ name: 'X', proceduralStatus: 'SENTENCED', establishedFindings: ['convicted'] }).length, 0);
  assert.equal(validatePerson({ name: 'Y', proceduralStatus: 'CONFLICT OF INTEREST FOUND', establishedFindings: ['coi found'] }).length, 0);
  // but a mere sanction/resignation may NOT carry an established finding
  assert.ok(validatePerson({ name: 'Z', proceduralStatus: 'SANCTIONED', establishedFindings: ['guilty'] }).length > 0);
  assert.equal(validateMoney({ amount: 40000, classification: 'COURT-ESTABLISHED BRIBE', sourceIds: ['S1'] }).length, 0);
});

test('PRODUCTION eu-cases.json is valid and free of sample/unfinished allegations', () => {
  const cases = readJson(join(DATA, 'eu-cases.json'));
  assert.ok(Array.isArray(cases));
  for (const c of cases) {
    assert.notEqual(c.sample, true, `production EU case ${c.caseNumber} is flagged sample`);
    const v = validateCase(c);
    assert.equal(v.ok, true, `invalid production EU case ${c.caseNumber}: ${v.errors.join('; ')}`);
  }
});

test('EU development sample is isolated to tests, flagged, and valid', () => {
  assert.equal(existsSync(join(DATA, 'eu-cases.sample.json')), false, 'EU sample must not live in served data');
  const sc = readJson(join(FIXTURES, 'eu-cases.sample.json'));
  assert.ok(sc.length >= 1);
  for (const c of sc) {
    assert.equal(c.sample, true);
    assert.ok(EU_CASE_NUMBER_RE.test(c.caseNumber));
    assert.equal(validateCase(c).ok, true, JSON.stringify(validateCase(c).errors));
  }
});

test('satire is structurally separated from factual content', () => {
  const sc = readJson(join(FIXTURES, 'eu-cases.sample.json'))[0];
  // Factual fields are strings/arrays; satire lives only in clerkAssessment/johnNotes.
  assert.equal(typeof sc.executiveSummary, 'string');
  assert.equal(typeof sc.clerkAssessment, 'object');
  assert.ok(!('departmentVerdict' in sc), 'satire must not leak into the case root');
  assert.ok(!('clerkAssessment' in (sc.money[0] || {})), 'satire must not live inside a money record');
});

test('build ships the EU Desk page but NOT the EU sample data', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
  assert.ok(existsSync(join(ROOT, 'site', 'dist', 'eu-desk.html')), 'eu-desk.html missing from dist');
  assert.ok(existsSync(join(ROOT, 'site', 'dist', 'scripts', 'lib', 'eu.js')));
  assert.ok(existsSync(join(ROOT, 'site', 'dist', 'data', 'eu-cases.json')));
  assert.equal(existsSync(join(ROOT, 'site', 'dist', 'data', 'eu-cases.sample.json')), false);
});

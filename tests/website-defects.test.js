/* Regression coverage for the confirmed website-defect fixes.
   Validates the BUILT output/data so these exact defects cannot silently return. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'site', 'dist');

function build() { execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' }); }
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const readText = (p) => readFileSync(p, 'utf8');

test('Belgian archive uses a neutral loading state, never a static "0 files"', () => {
  build();
  const html = readText(join(DIST, 'belgian-desk.html'));
  assert.doesNotMatch(html, />\s*0 files\s*</, 'archive still ships a static "0 files" state');
  assert.match(html, /Loading files/i, 'archive is missing a neutral loading state');
});

test('unbuilt "Submit a Bad Decision" section is gone', () => {
  build();
  const html = readText(join(DIST, 'belgian-desk.html'));
  assert.doesNotMatch(html, /Submit a Bad Decision/i, 'the unbuilt Submit section is still present');
});

test('no visitor-facing "Pending" lessons-learned copy in EU or Belgian data', () => {
  build();
  for (const f of ['belgian-cases.json', 'eu-cases.json']) {
    const cases = readJson(join(DIST, 'data', f));
    for (const c of cases) {
      const ll = c.clerkAssessment && c.clerkAssessment.lessonsLearned;
      if (ll) assert.doesNotMatch(ll, /^\s*Pending/i, `${f} ${c.caseNumber} still has "Pending" lessonsLearned`);
    }
  }
});

test('homepage title reflects the EU-first Department, not the Belgian Desk', () => {
  build();
  const html = readText(join(DIST, 'index.html'));
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  assert.match(title, /European Union Desk/i, 'homepage title does not mention the EU Desk');
  assert.doesNotMatch(title, /Belgian Desk/i, 'homepage title still leads with the Belgian Desk');
});

test('"Public Records Office" is standardised (no singular "Public Record Office")', () => {
  build();
  for (const f of ['index.html', 'eu-desk.html', 'belgian-desk.html']) {
    const html = readText(join(DIST, f));
    assert.doesNotMatch(html, /Public Record Office/, `${f} still uses the singular "Public Record Office"`);
  }
});

test('internal Belgian case links open in the same tab (only external links get target=_blank)', () => {
  build();
  const js = readText(join(DIST, 'scripts', 'belgian-desk.js'));
  // The link() helper must guard target=_blank behind an http(s) check.
  assert.match(js, /\/\^https\?:\/i\.test\(href\)/, 'link() no longer guards target=_blank to external URLs only');
});

test('Belgian money as-of phrasing reads cleanly (no "As of reported/projected to/over ...")', () => {
  build();
  const cases = readJson(join(DIST, 'data', 'belgian-cases.json'));
  for (const c of cases) {
    const figs = (c.publicMoney && c.publicMoney.figures) || [];
    for (const fg of figs) {
      if (fg.asOf) assert.doesNotMatch(fg.asOf, /^(reported|projected to|over )\b/i,
        `${c.caseNumber} figure "${fg.label}" has awkward asOf "${fg.asOf}"`);
    }
  }
});

test('Samusocial no longer duplicates the Brussels level as a location', () => {
  build();
  const c = readJson(join(DIST, 'data', 'belgian-cases.json')).find((x) => x.caseNumber === 'DBD-BE-0006');
  assert.ok(c, 'DBD-BE-0006 missing');
  assert.notEqual(c.location, 'Brussels', 'Samusocial still sets location "Brussels", duplicating the BRUSSELS level');
});

test('Agusta no longer labels a reference work as an Official Report', () => {
  build();
  const c = readJson(join(DIST, 'data', 'belgian-cases.json')).find((x) => x.caseNumber === 'DBD-BE-0002');
  for (const s of c.sources || []) {
    if (/Universalis/i.test(s.sourceName || '')) {
      assert.notEqual(s.sourceType, 'OFFICIAL REPORT', 'Encyclopaedia Universalis is still mislabelled OFFICIAL REPORT');
    }
  }
});

test('tunnel bulletin covers only the tunnel (no €771m Beliris programme)', () => {
  build();
  const b = readJson(join(DIST, 'data', 'belgian-bulletins.json')).find((x) => x.caseNumber === 'DBD-BE-B-0005');
  assert.ok(b, 'tunnel bulletin missing');
  assert.doesNotMatch(b.publicRecord, /771/, 'tunnel bulletin still mentions the unrelated €771m programme');
  assert.doesNotMatch(b.publicRecord, /Beliris/, 'tunnel bulletin still references the Beliris programme');
  assert.match(b.publicRecord, /462\.6/, 'tunnel bulletin lost the €462.6m contract figure');
  assert.match(b.publicRecord, /512/, 'tunnel bulletin lost the ~€512m reported total');
});

test('Agrofert and Frontex money notes are case-appropriate (no seizure/bribe wording)', () => {
  build();
  const eu = readJson(join(DIST, 'data', 'eu-cases.json'));
  for (const id of ['DBD-EU-0004', 'DBD-EU-0005']) {
    const c = eu.find((x) => x.caseNumber === id);
    assert.ok(c && c.moneyNote, `${id} is missing a case-appropriate moneyNote`);
    assert.doesNotMatch(c.moneyNote, /seizure|bribe/i, `${id} moneyNote still uses generic seizure/bribe wording`);
    assert.match(c.moneyNote, /audit|discharge|OLAF/i, `${id} moneyNote should reflect the audit/discharge nature`);
  }
  // The EU renderer must consume the per-case note, not hard-code the seizure/bribe line.
  const euJs = readText(join(DIST, 'scripts', 'eu-desk.js'));
  assert.match(euJs, /c\.moneyNote/, 'eu-desk.js does not consume the per-case moneyNote');
});

test('Court-of-Audit bulletins cite specific report pages, not generic listings', () => {
  build();
  const bs = readJson(join(DIST, 'data', 'belgian-bulletins.json'));
  for (const id of ['DBD-BE-B-0001', 'DBD-BE-B-0002', 'DBD-BE-B-0003', 'DBD-BE-B-0004']) {
    const b = bs.find((x) => x.caseNumber === id);
    assert.ok(b, `${id} missing`);
    const audit = (b.sources || []).find((s) => s.sourceType === 'COURT OF AUDIT');
    assert.ok(audit, `${id} has no COURT OF AUDIT source`);
    // Must be a specific publication/document page, not a generic listing.
    assert.match(audit.sourceURL, /\/publicatie\/|iddoc=/, `${id} audit source is a generic page: ${audit.sourceURL}`);
    assert.doesNotMatch(audit.sourceURL, /\/rekenhof\/publicaties$|documentation-fr/, `${id} audit source is a generic listing`);
  }
});

test('Agusta cites an authoritative court source (ECtHR)', () => {
  build();
  const c = readJson(join(DIST, 'data', 'belgian-cases.json')).find((x) => x.caseNumber === 'DBD-BE-0002');
  const court = (c.sources || []).find((s) => s.sourceType === 'JUDGMENT');
  assert.ok(court, 'Agusta has no authoritative court (JUDGMENT) source');
  assert.match(court.sourceURL || '', /hudoc\.echr\.coe\.int/, 'Agusta court source is not the ECtHR HUDOC judgment');
});

test('the Vandenbroucke / Medista-Movianto file is present and separates allegation from finding', () => {
  build();
  const c = readJson(join(DIST, 'data', 'belgian-cases.json')).find((x) => x.caseNumber === 'DBD-BE-0007');
  assert.ok(c, 'DBD-BE-0007 (Vandenbroucke / Medista-Movianto) is missing');
  const blob = JSON.stringify(c).toLowerCase();
  // No unqualified assertion of wrongdoing by the minister.
  assert.doesNotMatch(blob, /vandenbroucke[^.]{0,60}(committed|guilty of|convicted)/, 'unqualified wrongdoing asserted against the minister');
  assert.match(blob, /no finding of any kind against him|no wrongdoing by/, 'file must state no finding against the minister');
  assert.match(blob, /audit finding|administrative/, 'file must frame the audit as administrative');
});

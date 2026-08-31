import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanForSecrets, gitignoreCoversSecrets } from '../scripts/lib/secret-scan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

test('the repository itself is clean of secret-like content', () => {
  const findings = scanForSecrets(ROOT);
  assert.deepEqual(findings, [], 'unexpected secret findings: ' + JSON.stringify(findings));
});

test('repo .gitignore covers the critical secret patterns', () => {
  const r = gitignoreCoversSecrets(ROOT);
  assert.equal(r.ok, true, 'missing: ' + r.missing.join(', '));
});

test('scanner detects a planted Solana keypair array', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dbd-secret-'));
  const arr = Array.from({ length: 64 }, (_, i) => (i * 3) % 256).join(',');
  writeFileSync(join(dir, 'leaked.json'), `[${arr}]`);
  const findings = scanForSecrets(dir);
  assert.ok(findings.length >= 1, 'expected the planted keypair to be detected');
  assert.ok(findings.some((f) => f.pattern.includes('keypair')));
});

test('scanner flags a committed .env', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dbd-env-'));
  writeFileSync(join(dir, '.env'), 'SECRET=abc123');
  const findings = scanForSecrets(dir);
  assert.ok(findings.some((f) => f.pattern.includes('.env')));
});

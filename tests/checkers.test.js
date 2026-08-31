import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function runScript(rel) {
  try {
    const stdout = execFileSync(process.execPath, [join(ROOT, rel)], { stdio: 'pipe' });
    return { code: 0, stdout: stdout.toString() };
  } catch (err) {
    return { code: err.status ?? 1, stdout: (err.stdout || '').toString(), stderr: (err.stderr || '').toString() };
  }
}

test('prelaunch checker passes on the default pre-launch config (exit 0)', () => {
  const r = runScript('scripts/prelaunch-check.js');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /DBD PRE-LAUNCH CHECK/);
  assert.match(r.stdout, /STATUS: READY/);
  assert.match(r.stdout, /NOT YET CREATED/);
});

test('postlaunch checker refuses to run before a mint is configured (exit 2)', () => {
  const r = runScript('scripts/postlaunch-check.js');
  assert.equal(r.code, 2, r.stdout + (r.stderr || ''));
});

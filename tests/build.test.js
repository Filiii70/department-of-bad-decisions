import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

test('site builds and produces a complete dist', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.js')], { stdio: 'pipe' });
  for (const f of ['index.html', 'config.json', 'build-info.json', 'styles/main.css', 'scripts/site.js', 'assets/favicon.svg']) {
    assert.ok(existsSync(join(ROOT, 'site', 'dist', f)), 'missing dist file: ' + f);
  }
  const cfg = JSON.parse(readFileSync(join(ROOT, 'site', 'dist', 'config.json'), 'utf8'));
  assert.equal(cfg.project_name, 'Department of Bad Decisions');
});

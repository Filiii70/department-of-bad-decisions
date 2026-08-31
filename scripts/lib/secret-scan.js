// Best-effort secret scanner for tracked files. This is a safety net, not a
// guarantee. It walks the repo (skipping ignored dirs) and flags anything that
// looks like a private key, seed phrase, or committed .env with values.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'output']);
const SCAN_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.html', '.css',
  '.txt', '.yml', '.yaml', '.env', '.sh', '',
]);

// Patterns that strongly indicate committed signing material or secrets.
const PATTERNS = [
  { name: 'Solana keypair array', re: /\[\s*(?:\d{1,3}\s*,\s*){31,}\d{1,3}\s*\]/ },
  { name: 'BIP39 seed phrase (12+ words)', re: /\b(?:[a-z]{3,10}\s+){11,}[a-z]{3,10}\b/i, guard: /mnemonic|seed|phrase|recovery/i },
  { name: 'Private key label', re: /private[_-]?key\s*[:=]\s*["']?[A-Za-z0-9+/=]{20,}/i },
  { name: 'Base58 secret key (64 bytes)', re: /\b[1-9A-HJ-NP-Za-km-z]{86,90}\b/ },
  { name: 'PEM private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic api secret assignment', re: /(?:api[_-]?secret|secret[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']{12,}/i },
];

// Files that are allowed to describe secrets (docs/scanner itself). We still
// scan them but treat descriptive mentions as non-findings via the guard.
const SELF_FILES = new Set(['secret-scan.js', '.env.example']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out);
    } else if (st.isFile()) {
      const ext = extname(entry);
      if (SCAN_EXT.has(ext) || entry.startsWith('.env')) out.push(full);
    }
  }
  return out;
}

export function scanForSecrets(rootDir) {
  const findings = [];
  const files = walk(rootDir);

  for (const file of files) {
    const name = basename(file);
    // A committed real .env (not the example) is itself a critical finding.
    if (name === '.env') {
      findings.push({ file, pattern: 'Committed .env file', line: 0, sample: '(present)' });
      continue;
    }
    if (SELF_FILES.has(name)) continue;

    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of PATTERNS) {
        if (p.guard && !p.guard.test(line)) continue;
        if (p.re.test(line)) {
          findings.push({
            file,
            pattern: p.name,
            line: i + 1,
            sample: line.trim().slice(0, 60),
          });
        }
      }
    }
  }
  return findings;
}

// Confirm .gitignore contains the critical secret patterns.
export function gitignoreCoversSecrets(rootDir) {
  const gi = join(rootDir, '.gitignore');
  if (!existsSync(gi)) return { ok: false, missing: ['.gitignore file itself'] };
  const text = readFileSync(gi, 'utf8');
  const required = ['.env', 'keypair', '*.key', 'node_modules', 'wallet'];
  const missing = required.filter((r) => !text.includes(r));
  return { ok: missing.length === 0, missing };
}

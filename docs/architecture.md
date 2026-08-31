# Architecture

## Philosophy

Zero paid infrastructure. The only unavoidable cost is Solana on-chain fees at
launch, paid manually by the creator wallet. Everything else runs locally or on
free static hosting.

## Shape of the system

```
config/dbd.config.json   <- single source of truth (all public, no secrets)
        |
        |  read by everything below
        v
scripts/lib/             <- shared, pure-ish libraries
  config.js              config load + structural validation
  solana.js              base58 validation + read-only JSON-RPC
  links.js               deterministic explorer / platform URL builders
  report.js              CLI formatting helpers
  secret-scan.js         best-effort secret detector

scripts/
  build-site.js          assembles site/dist (static), injects config.json
  serve.js               tiny local static server (preview only)
  prelaunch-check.js     pre-launch gate, exits non-zero on critical fail
  postlaunch-check.js    on-chain verification after launch
  solana-util.js         read-only balance / supply / holders CLI

monitoring/monitor.js    CLI + JSON supply/concentration/balances snapshot

site/                    static website source; dist is generated, git-ignored
launch/                  checklist + manual runbook
tests/                   node --test suite, zero dependencies
```

## Data flow

1. A human edits the canonical config.
2. `build-site.js` validates it and copies it verbatim into `site/dist/config.json`.
3. The static site fetches `config.json` at runtime and renders. There is no
   backend, no database, no API. The page is read-only.
4. Checkers and monitor read the same canonical config and, where needed, query
   a public Solana RPC endpoint (read-only) abstracted behind `SOLANA_RPC_URL`.

## Why no framework

The site is a single static HTML page plus one CSS file and one small script.
Astro or Vite would add a large dependency tree for no benefit at this size.
Keeping dependencies at zero means a clean clone builds with only Node installed,
nothing to download, nothing to break, nothing to pay for.

## Runtime dependencies

- Node.js 18+ (for the tooling and the build). This is the only prerequisite.
- A public Solana RPC endpoint for the on-chain read features. The default is the
  public mainnet endpoint; it is rate-limited. `SOLANA_RPC_URL` can point at any
  replacement later without code changes.

## Explicit non-goals for V1

- No wallet connection on the site.
- No user input, no forms, no login.
- No analytics, tracking pixels, or third-party scripts.
- No automated launching, minting, or signing.
- No trading, liquidity, or volume simulation of any kind.

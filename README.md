# Department of Bad Decisions ($DBD)

> The Department does not recommend purchasing meme coins.
> Unfortunately, the Department has issued one.

A zero-budget public launch repository for **Department of Bad Decisions**
(`$DBD`), a bureaucratic-parody meme coin on **Solana**.

> "Your judgement has been reviewed. It was terrible. **APPROVED**."

---

## What DBD is

A parody meme coin with an exhausted-government-clerk aesthetic: official forms,
red APPROVED stamps, dry humor. It has no intrinsic value, no promise of return,
and no team obligation. It is a joke you can verify.

## What this repository is

A complete, honest launch kit that costs nothing to run beyond unavoidable
Solana on-chain fees at launch:

- A static, read-only website (single HTML page, one CSS file, one small script).
- A canonical config that is the single source of truth for everything.
- A pre-launch checker that gates readiness and refuses to hide problems.
- A post-launch checker that verifies the live mint against the website.
- Read-only Solana utilities and a monitor (supply, concentration, balances).
- Launch checklist, manual runbook, and full operational docs.

## What this repository does NOT do

- It does not launch, mint, or sign anything. The final token creation is a
  deliberate manual action from the creator wallet. See
  `launch/manual-launch-runbook.md`.
- It never asks for, stores, or needs a private key or seed phrase.
- It has no wallet connection, no login, no user input, no database, no backend.
- It has no analytics, no tracking, no third-party scripts.
- It never fabricates data or fakes holders, volume, liquidity, or engagement.

## Zero-budget philosophy

The only unavoidable cost is Solana on-chain fees at launch, paid manually by the
creator wallet. Everything else is local tooling or free static hosting. There
are zero npm dependencies: a clean clone needs only Node.js 18+.

## Security model (short version)

- Read-only everywhere. Nothing here can move funds.
- Secrets never enter the repo. `.gitignore` blocks `.env`, keypairs, and wallet
  exports; the pre-launch checker scans tracked files and fails on anything
  key-like or on a committed `.env`.
- No hidden owner privileges. Full detail in `docs/security.md`.

---

## Requirements

- Node.js 18 or newer. That is the only prerequisite. (No paid services, no RPC
  account required for basic use.)

## Run locally

```bash
# from a clean clone
npm install          # no-op: there are zero dependencies
npm run build        # assembles site/dist from config
npm run serve        # preview at http://localhost:4321
```

## Configure for pre-launch

1. Copy the environment example (optional, only for RPC/port):
   ```bash
   cp .env.example .env
   ```
2. Edit `config/dbd.config.json`. Fill the placeholders marked `REPLACE_ME`:
   `creator_wallet`, `treasury_wallet`, `operational_wallet` (optional),
   `official_x`, `official_telegram`, `official_github`, `official_website`.
   Leave `official_mint` as `NOT_YET_ISSUED` and `launch_status` as `prelaunch`.
3. See `config/README.md` for every field's meaning.

## Run checks

```bash
npm run prelaunch-check     # gate readiness; exits non-zero on critical failure
npm test                    # full suite: config, checkers, URLs, secrets, build
```

Example pre-launch output:

```
DBD PRE-LAUNCH CHECK
====================

Website ........... PASS
Configuration ..... PASS
Social links ...... PASS
Security scan ..... PASS
Secrets ........... PASS
Mint address ...... NOT YET CREATED

STATUS: READY
```

## Run monitoring

```bash
npm run monitor             # CLI summary + monitoring/output/monitor.json
```

Read-only Solana lookups:

```bash
npm run solana balance <address>
npm run solana supply <mint>
npm run solana holders <mint>
npm run solana token-balance <owner> <mint>
```

RPC endpoint is configurable via `SOLANA_RPC_URL` (defaults to the public
mainnet endpoint). No paid RPC provider is required for basic use.

## Transition to live (after the manual launch)

You change exactly three fields in `config/dbd.config.json` and nothing else:

1. `official_mint` -> the real mint address from the launch transaction.
2. `launch_status` -> `"live"`.
3. `launch_timestamp` -> the real ISO 8601 time.

Then bump `config_version`, update `last_updated`, and:

```bash
npm run build               # rebuild the site with the live mint
npm run postlaunch-check    # verify the mint exists on chain and matches the site
```

Full sequence: `launch/launch-checklist.md` and `launch/manual-launch-runbook.md`.

---

## Repository layout

```
config/       canonical config + field docs
site/         static website source (dist/ is generated, git-ignored)
assets/       favicon, APPROVED stamp, clerk mascot placeholder (SVG)
scripts/      build, serve, checkers, solana utility, shared libs
monitoring/   read-only monitor (CLI + JSON)
launch/       checklist + manual runbook
docs/         architecture, security, wallet policy, incident response,
              transparency policy, post-launch operations
tests/        node --test suite, zero dependencies
```

## Documentation

- `docs/architecture.md`
- `docs/security.md`
- `docs/wallet-policy.md`
- `docs/incident-response.md`
- `docs/transparency-policy.md`
- `docs/post-launch-operations.md`

## Disclaimer

This is a parody project. Nothing here is financial advice. `$DBD` is not an
investment, security, or financial product. Only ever trust the single official
mint address published on the official website, and verify it against this
repository. The project will never ask you for your seed phrase or private key.

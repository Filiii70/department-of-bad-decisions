# Department of Bad Decisions

**Bureaucratic satire built from public records.**

> "Your judgement has been reviewed. It was terrible. **APPROVED**."

The Department of Bad Decisions is an independent, tongue-in-cheek "government
office" that files the powerful the way a tired civil servant files paperwork.
It reads the public record, keeps the receipts, and stamps the result.

**Current active desk: European Union Desk.**

## They run Europe. We pay.

The European Union Desk documents real, publicly sourced cases about money,
power and connections around the institutions of the EU: what happened, where
the money went, what happened to the people involved, and who knows who.

Each case is written in two clearly separated layers:

- **The factual record.** Every money figure, legal status, charge,
  conviction, institutional finding and network connection is stated in precise
  language and backed by a cited public source, with a `lastVerified` date.
- **The satire.** The Department's commentary (delivered by John, the Clerk)
  lives in its own labelled fields. It never rewrites a fact, and it is never
  presented as a finding.

The Department does not make legal findings. Courts, prosecutors and
investigators do that. An allegation is never printed as fact, an investigation
is never printed as guilt, a charge is never printed as a conviction, and an
audit finding is never printed as a criminal finding.

### Evidence standard

Sources are drawn from primary and institutional records first: courts and
prosecutors, EU institutions, OLAF, the EPPO, the European Court of Auditors,
the European Ombudsman, national parliaments and their official publications.
Reputable reporting is used to add context, not to establish legal status.
Cases without a citeable public source are not published.

## The $DBD token (pre-launch)

There is, regrettably, a token. It is satire first and a token second.

- **Status: PRE-LAUNCH.**
- **Network: Solana.**
- **Intended launch platform: Pump.fun.**
- **No presale.**
- **No private round.**
- **No guaranteed returns**, no guaranteed liquidity, and no promise that the
  token will increase in value.
- **Official mint: NOT YET ISSUED.**

There is currently no official `$DBD` contract address. When a mint is issued,
it will be published on the official website and in this repository, and it can
be verified on the site's public verification page before anyone interacts with
any token claiming to be `$DBD`. The Department will never ask you for your seed
phrase or private key, and will never DM you first asking for money.

## Official links

- Website: https://department-of-bad-decisions.pages.dev
- X: https://x.com/DBDDepartment
- Telegram: https://t.me/DBDDepartment

The website's Verify page ("Don't trust us. Verify us.") lists the official
wallets, channels and launch policy from a single canonical configuration.

## What this repository is

A zero-dependency, read-only static site plus its supporting tooling and docs.

- The website source (`site/`), assembled into `site/dist/` by a small build
  script. No framework, no bundler, no third-party scripts.
- A canonical config (`config/dbd.config.json`) that is the single source of
  truth for wallets, channels, status and, eventually, the mint.
- Pre-launch and post-launch checkers, read-only Solana utilities and a monitor.
- Full operational documentation under `docs/`.

It never launches, mints or signs anything. The eventual token creation is a
deliberate manual action from the creator wallet. It has no wallet connection,
no login, no database, no backend, no analytics and no tracking. It never
fabricates holders, volume, liquidity or engagement.

## Requirements

- Node.js 18 or newer. That is the only prerequisite. There are zero npm
  dependencies.

## Run locally

```bash
npm install          # no-op: there are zero dependencies
npm run build        # assembles site/dist from config
npm run serve        # preview at http://localhost:4321
```

## Run checks

```bash
npm test                    # full suite: config, checkers, URLs, secrets, build
npm run prelaunch-check     # gate readiness; exits non-zero on critical failure
```

## Repository layout

```
config/       canonical config + field docs
site/         static website source (dist/ is generated, git-ignored)
assets/       favicon, APPROVED stamp, brand art, the Clerk
scripts/      build, serve, checkers, solana utility, shared libs
monitoring/   read-only monitor (CLI + JSON)
launch/       checklist + manual runbook
docs/         architecture, security, wallet policy, incident response,
              transparency policy, EU/Belgian desk notes
tests/        node --test suite, zero dependencies
```

## Documentation

- `docs/architecture.md`
- `docs/eu-desk.md`
- `docs/security.md`
- `docs/wallet-policy.md`
- `docs/transparency-policy.md`
- `docs/incident-response.md`
- `docs/post-launch-operations.md`

## Disclaimer

This is a parody project. Nothing here is financial, investment, legal or tax
advice. `$DBD` is not an investment, a security or a financial product. Digital
assets are highly speculative and may lose all value. Only ever trust the single
official mint address published on the official website once it exists, and
verify it against this repository. The project will never ask you for your seed
phrase or private key.

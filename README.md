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
- **Launch platform: Pump.fun.**
- **Official launch: 15 September 2026 at 20:00 CEST (18:00 UTC).**
- **No presale.**
- **No private round.**
- **No guaranteed returns**, no guaranteed liquidity, and no promise that the token will increase in value.
- **Official mint: NOT YET ISSUED.**

There is currently no official `$DBD` contract address. When a mint is issued,
it will be published on the official website and in this repository. The
Department will never ask you for your seed phrase or private key, and will never
DM you first asking for money.

## Community rewards and current allocation policy

DBD is reserving **5% of the total 1,000,000,000 DBD supply (50,000,000 DBD)**
for community rewards: early members, contests, exceptional contributors and
future community actions. It is not intended to be distributed all at once.

Current pre-launch rewards:

- Every genuine pre-launch community member: **10,000 DBD reserved**.
- Every valid original entry in the first DBD meme contest: **+25,000 DBD** once per person.
- 1st place: **2,000,000 DBD**.
- 2nd place: **1,000,000 DBD**.
- 3rd place: **500,000 DBD**.
- 4th through 10th: **100,000 DBD each**.
- Contest deadline: **12 September 2026 at 18:00 UTC**; winners targeted for **13 September 2026**.

Rewards are denominated only in DBD and have no guaranteed fiat value. DBD has
not been minted yet, so pre-launch rewards are recorded/reserved and can only be
distributed after the official mint. No purchase, payment or wallet connection
is required. Obvious bots, duplicate accounts and reward farming do not qualify.

Current insider allocation policy:

- Creator: **maximum 2.5% (25,000,000 DBD)**; creator fees are separate and disclosed.
- Each active moderator: **1% base for proven active contribution**, with up to **1.5% additional performance allocation**, maximum **2.5% (25,000,000 DBD) per moderator**. The maximum is earned, not automatic.
- Moderator bonuses are based on genuine community growth, correct campaign/contest execution and active launch support — never token price, artificial volume, a pump, bots or fake engagement.

Creator, moderator and project allocations are intended to be transparent and to
use locking/vesting where appropriate so insiders cannot simply receive large
fully liquid allocations and dump them on the community. The exact technical
vesting/unlock schedule is still being finalised and will be published before it
is represented as final.

## Official links

- Website: https://department-of-bad-decisions.pages.dev
- X: https://x.com/DBDDepartment
- Telegram announcements: https://t.me/DBDDepartment
- Telegram community: https://t.me/DBDDepartmentChat
- GitHub: https://github.com/Filiii70/department-of-bad-decisions

The website's Verify page ("Don't trust us. Verify us.") lists the official
wallets, channels and launch policy from a single canonical configuration.

## What this repository is

A zero-dependency, read-only static site plus its public supporting tooling and
documentation.

- Website source (`site/`), assembled into `site/dist/` by a small build script.
- Canonical public config (`config/dbd.config.json`) for wallets, channels, status and eventually the mint.
- Public pre/post-launch verification tools and read-only monitoring.
- Public policy and editorial documentation under `docs/`.

Internal launch execution material is deliberately not part of the public working
tree. Transparency means the public can verify what DBD claims and does; it does
not require publishing operational execution playbooks.

The repository never launches, mints or signs anything. It has no wallet
connection, login, database, backend, analytics or tracking, and never fabricates
holders, volume, liquidity or engagement.

## Requirements

- Node.js 18 or newer. Zero npm dependencies.

## Run locally

```bash
npm install
npm run build
npm run serve
```

## Run checks

```bash
npm test
npm run prelaunch-check
```

## Repository layout

```
config/       canonical public config + field docs
site/         static website source (dist/ is generated, git-ignored)
assets/       favicon, APPROVED stamp, brand art, the Clerk
scripts/      build, serve, checkers, Solana utility, shared libs
monitoring/   read-only monitor
docs/         public architecture, security, policy and editorial notes
tests/        node --test suite
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

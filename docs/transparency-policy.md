# Transparency Policy

The Department is a parody. Its transparency is not.

## What we publish

- The single official mint address, once it exists, on the website.
- The public addresses of the creator, treasury, and optional operational wallets.
- The full source of this repository, including the site and every check.
- The launch status, config version, and last-updated timestamp on the site.
- Material creator, moderator and community allocation policies.
- Community reward rules and material changes to those rules.
- The locking/vesting terms for material insider allocations once finalised.

## Current pre-launch commitments

- Official launch: **15 September 2026 at 20:00 CEST (18:00 UTC)** on Pump.fun.
- Total intended supply: **1,000,000,000 DBD**.
- Community reserve: **5% / 50,000,000 DBD**.
- Genuine pre-launch community members: **10,000 DBD reserved per qualifying person**.
- Creator token allocation: **maximum 2.5% / 25,000,000 DBD**; creator fees are separate and disclosed.
- Active moderators: **1% base for proven active contribution, up to 2.5% maximum per moderator when earned**.
- The first meme contest rewards are documented in the public README.

Pre-launch rewards are reservations only: DBD has not yet been minted. They have
no guaranteed fiat value and cannot be distributed until an official mint
exists. No purchase or wallet connection is required for the early-member
reward or contest.

## Insider fairness / anti-dump policy

The public is free to make its own trading decisions. DBD does not promise or
attempt to guarantee a market price.

The project will not hide creator or moderator allocations. Material insider
allocations are intended to use transparent locking/vesting where appropriate
rather than being handed over as large fully liquid positions. Unearned
moderator performance allocations are not treated as earned compensation.

The exact technical vesting and unlock schedule is still being finalised. It
will be published before the project represents any specific lock or unlock
schedule as final. Until then, no specific unlock date should be inferred or
promised.

## Single source of truth

`config/dbd.config.json` is the canonical machine-readable record for launch
status, wallets, official channels and, eventually, the mint. The website, the
checkers, and the monitor read it. Broader public policies and commitments that
do not belong in runtime config are documented in this repository and therefore
remain visible in version history.

## One mint, forever

There is exactly one official mint. It is published only after creation through
the official channels and website. Any other token using the DBD name or ticker
before that is not ours. We will never announce a "new" or "migrated" contract
through a random DM or a lookalike account. Any material mint/status change is
visible in this repository's commit history and on the website.

## No dark patterns

- No wallet connection on the site.
- No user tracking, no analytics, no third-party scripts, no pixels.
- No hidden owner privileges in the code.
- No fabricated metrics. When data cannot be retrieved, tools show UNAVAILABLE.
- No guaranteed return, price or liquidity claims.
- No fake engagement, artificial volume or pump target as a condition for moderator rewards.

## Verifiability

Anyone can clone this repository, run `npm run build`, run `npm test`, and run
`npm run postlaunch-check` after launch to confirm that the mint shown on the
website matches the one on chain. Nothing about the public record depends on
trusting us; it depends on checking.

## Changes

Material changes to wallets, mint, status, allocations or published reward
policies are recorded in version control. The site's config version and
last-updated fields make the current machine-readable state legible at a glance.

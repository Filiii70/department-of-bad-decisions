# Transparency Policy

The Department is a parody. Its transparency is not.

## What we publish

- The single official mint address, once it exists, on the website.
- The public addresses of the creator, treasury, and optional operational wallets.
- The full source of this repository, including the site and every check.
- The launch status, config version, and last-updated timestamp on the site.

## Single source of truth

`config/dbd.config.json` is the one canonical record. The website, the checkers,
and the monitor all read it. There is no hidden second source and no server that
can quietly say something different from what is committed here.

## One mint, forever

There is exactly one official mint. It is published only on the official website.
Any other token using the DBD name or ticker is not ours. We will never announce
a "new" or "migrated" contract through a random DM or a lookalike account. If the
mint ever needs to change, the change will be visible in this repository's commit
history and on the website at the same time.

## No dark patterns

- No wallet connection on the site.
- No user tracking, no analytics, no third-party scripts, no pixels.
- No hidden owner privileges in the code.
- No fabricated metrics. When data cannot be retrieved, tools show UNAVAILABLE.

## Verifiability

Anyone can clone this repository, run `npm run build`, run `npm test`, and run
`npm run postlaunch-check` after launch to confirm that the mint shown on the
website matches the one on chain. Nothing about the public record depends on
trusting us; it depends on checking.

## Changes

Material changes to wallets, mint, or status are made by editing the canonical
config and are therefore recorded in version control. The site's config version
and last-updated fields make the current state legible at a glance.

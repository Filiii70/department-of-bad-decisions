# Manual Launch Runbook

## The one rule

The final token creation and launch transaction is a deliberate, manual action
executed by a human from the official creator wallet. This repository does not
and will not perform it. There is no script here that mints, launches, or signs.
Nothing in this repo needs your private key.

This runbook describes the manual steps a human performs outside this repository,
and the repository steps that happen before and after.

---

## Before you touch anything on chain

1. Run `npm run prelaunch-check`. Do not proceed unless STATUS is READY with no
   warnings. Fix every warning first.
2. Confirm the three wallets exist and you control them. Only public addresses
   belong in `config/dbd.config.json`. Private keys and seed phrases stay in your
   wallet app or hardware device and are never written into this project.
3. Confirm the creator wallet holds enough SOL to cover on-chain fees. See
   "What requires SOL" below.

## The manual launch (done by a human, not by this repo)

You will use a launch venue of your choice (for example pump.fun) or a direct
SPL token creation flow. That happens in that venue's own interface or CLI,
signed by your wallet, under your own eyes. This repo intentionally has no part
in it. When the token is created:

1. Copy the exact mint address directly from the transaction result. Do not
   retype it. A single wrong character sends holders to the wrong token.
2. Note the exact launch time in ISO 8601 (UTC), for example
   `2026-09-01T18:00:00Z`.

## Immediately after launch (repository steps)

1. Edit `config/dbd.config.json`:
   - `official_mint` = the real mint address you copied.
   - `launch_status` = `"live"`.
   - `launch_timestamp` = the real ISO time.
   - Bump `config_version` and update `last_updated`.
2. `npm run build`.
3. Redeploy the `site/dist` folder to your static host.
4. `npm run postlaunch-check`. Expect:
   - Mint format valid: PASS
   - Status is live: PASS
   - Mint exists on Solana: PASS
   - Website mint matches config: PASS
   If any check is UNAVAILABLE, it is a network/RPC issue. Rerun; do not edit
   config to force a pass.
5. `npm run monitor` to capture a baseline.

## What requires SOL

- The token creation transaction (paid by the creator wallet).
- Any initial liquidity or bonding-curve seed the launch venue requires. This is
  a decision you make in that venue, not here.
- Nothing else in this repository spends SOL. All tooling here is read-only.

## What requires a human decision

- Whether and when to launch at all.
- Which launch venue to use.
- How much SOL, if any, to commit as initial liquidity.
- Confirming the copied mint address is correct before publishing it.
- Flipping `launch_status` to `live`.

## Safety notes

- If anything looks wrong mid-launch, stop. A delayed launch is recoverable; a
  wrong mint published to the world is not.
- Never paste a seed phrase or private key into any file in this repository, any
  terminal command in this repository, or any website prompt. No legitimate step
  here asks for it.

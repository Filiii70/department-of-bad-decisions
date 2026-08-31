# Post-Launch Operations

Day-to-day running after the token is live. All of it is read-only and free.

## Immediately after launch

See `../launch/manual-launch-runbook.md`. In short: set `official_mint`,
`launch_status: live`, and `launch_timestamp` in config, bump `config_version`,
rebuild, redeploy, then run `npm run postlaunch-check` until it is clean.

## Routine checks

- `npm run postlaunch-check` after any config change, to confirm the site and the
  chain agree. If it reports UNAVAILABLE, that is an RPC issue: rerun, do not edit
  config to force a pass.
- `npm run monitor` on whatever cadence you like. It writes
  `monitoring/output/monitor.json` and prints a CLI summary. Archive the JSON if
  you want a history; the file is git-ignored by default.

## Reading the monitor

- Supply: total token supply from the mint.
- Top holder / Top 5 / Top 10: share of supply held by the largest token
  accounts the public RPC returns. Note that some large accounts may be pools or
  program accounts, not individuals. Read concentration as a signal, not a verdict.
- Creator / Treasury / Operational: SOL balances of the official wallets.
- Holders and Large transfers: shown as UNAVAILABLE on public RPC, which cannot
  give an exact holder count or a full transfer feed cheaply. To fill these later,
  point the tooling at an indexer by changing `SOLANA_RPC_URL`. No code change is
  required for the RPC swap; the holder-count and transfer features would be a
  future addition, kept optional and free-tier where possible.

## Keeping costs at zero

- Hosting: the site is static. Deploy `site/dist` to any free static host.
- RPC: the default public endpoint is free and rate-limited. Fine for light use.
- No paid backend, no database, no paid monitoring service is ever required.

## When something looks wrong

Go to `incident-response.md`. Match the situation to a scenario and follow
Detection, Immediate action, Public communication, Recovery. Keep every public
message pointed at the single official mint and the official channels, and never
ask users for secrets.

## Changing an official wallet later

If you must rotate a wallet, update its address in the canonical config, rebuild,
redeploy, and run `postlaunch-check` to confirm the site shows the new address.
The change is recorded in version control, which is the point.

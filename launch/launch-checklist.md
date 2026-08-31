# DBD Launch Checklist (technical only)

This checklist covers technical readiness only. It does not script promotion,
does not automate posting, and does not perform the launch. The final token
creation is a manual action. See `manual-launch-runbook.md`.

Legend: [ ] to do, [x] done. Run `npm run prelaunch-check` at every stage.

---

## T-14 days
- [ ] Repository cloned fresh; `npm install` succeeds (should be a no-op, zero deps).
- [ ] `npm run build` produces a complete `site/dist`.
- [ ] `npm test` passes on a clean clone.
- [ ] Three distinct wallets created and recorded (creator, treasury, operational).
      Public addresses only go into config. Secrets never leave the hardware/host.
- [ ] `config/dbd.config.json` filled: wallets, socials, website, explorer.
- [ ] Static host chosen (any free static host). Deploy the `site/dist` folder.

## T-7 days
- [ ] Official X, Telegram, GitHub live and linked in config.
- [ ] Website deployed at `official_website`; loads over https.
- [ ] Anti-scam section verified to render the correct name and ticker.
- [ ] `npm run prelaunch-check` shows all groups PASS (no placeholder warnings left).
- [ ] Explorer links resolve for creator and treasury wallets.
- [ ] Confirm `launch_status` is still `prelaunch` and mint shows NOT YET ISSUED.

## T-3 days
- [ ] RPC endpoint confirmed reachable: `npm run solana balance <creator_wallet>`.
- [ ] Decide launch platform; set `launch_platform` in config to a known value.
- [ ] Dry-run the post-launch steps on paper using the runbook.
- [ ] Verify creator wallet holds enough SOL for on-chain fees (see runbook).

## T-1 day
- [ ] Final `npm run prelaunch-check`: STATUS READY, no warnings.
- [ ] Website content frozen. Note the current `config_version`.
- [ ] Backups: config committed and pushed; wallet public addresses recorded offline.
- [ ] Confirm no secrets anywhere: `npm run prelaunch-check` security scan PASS.

## T-1 hour
- [ ] Creator wallet funded and confirmed on chain.
- [ ] All official channels reachable.
- [ ] Team member ready to update config and redeploy immediately after mint exists.
- [ ] `postlaunch-check` command staged in a terminal, ready to run.

## Launch (manual)
- [ ] Execute the manual launch transaction from the creator wallet (runbook).
- [ ] Capture the exact mint address from the transaction output. Do not type it
      from memory; copy it directly.

## T+15 minutes
- [ ] Set in config: `official_mint` = real mint, `launch_status` = `live`,
      `launch_timestamp` = actual ISO time. Bump `config_version`, update `last_updated`.
- [ ] `npm run build` and redeploy `site/dist`.
- [ ] `npm run postlaunch-check`: expect Mint exists PASS, website match PASS.
- [ ] Verify explorer link on the live website opens the correct token.

## T+1 hour
- [ ] `npm run monitor`: record supply and top holder concentration as a baseline.
- [ ] Confirm creator and treasury balances match expectations.
- [ ] Re-run `postlaunch-check`; resolve any UNAVAILABLE by rerunning.

## T+24 hours
- [ ] `npm run monitor` again; compare concentration against the T+1h baseline.
- [ ] Confirm the single official mint is the only one referenced anywhere official.
- [ ] Scan for impersonator tokens/accounts (see `docs/incident-response.md`).
- [ ] Archive the day-one monitor JSON for the record.

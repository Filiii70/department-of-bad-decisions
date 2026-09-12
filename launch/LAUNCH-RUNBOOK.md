# DBD Launch Runbook

Launch: 2026-09-15 20:00 CEST (18:00 UTC). Member deadline: 14:00 CEST (12:00 UTC).
Wallets: DBD Creator / DBD Treasury / DBD Operations / DBD Dev Privat (personal,
excluded) / Privat (out of scope) / Test SOL (testing only).

What the human does is small: connect DBD Creator, check the create data, approve
the create+buy, hand the mint to the tooling. Everything else is preparation and
verification. The tooling never signs and holds no keys.

## Before launch (by 14:00 CEST)
1. Close the member list at the deadline; export submissions to `launch/member-submissions.csv`.
2. `npm run members:validate` -> writes `launch/member-snapshot.csv` + report. Review rejects.
3. `npm run launch:obligations` -> confirm founder 10M + mods 50M + members total.
4. Add verified moderator wallets to `launch/moderators.json` (Zafir, Emmanuel).
5. `npm run mods:locks` -> must PASS (no blockers).
6. Update the Transparency page so the real allocation is public (already disclosed).
7. `npm run launch:simulate` -> full dry run; config must stay prelaunch.
8. Fund wallets per `launch/generated/simulation/WALLET-FUNDING-PLAN.md`
   (DBD Creator: create+buy SOL; DBD Operations: ATA rent + lock fees + buffer).

## At 20:00 CEST (human, in wallet)
1. Re-run pump.fun live verification (docs/PUMPFUN-LIVE-VERIFICATION-2026-09-15.md). Confirm nothing material changed.
2. Confirm the final eligible snapshot and total required DBD.
3. `npm run launch:quote` and compare to the LIVE create-screen quote. Trust the screen.
4. Confirm DBD Creator has enough SOL.
5. Confirm metadata: name "Department of Bad Decisions", ticker "DBD", 1000x1000 image, Mayhem OFF.
6. Connect DBD Creator wallet.
7. Create DBD on pump.fun; where supported, do the initial acquisition in the same tx.
8. Capture: mint address, pump.fun URL, creation tx, timestamp.
9. Verify the mint on Solscan AND on pump.fun.
10. Update `config/dbd.config.json` (official_mint, launch_status=live) via the apply-launch flow.
11. Publish the official CA on X/TG ONLY after verification.

## After the mint is live
1. Create moderator locks (Streamflow), human signs. Record lock address + tx in `launch/moderators.json`.
2. `npm run members:distribute -- --prepare`, then execute the batches from the human wallet; record signatures in the ledger.
3. `npm run launch:reconcile` -> deltas must be 0.
4. Update the public Transparency record (`launch/PUBLIC-TRANSPARENCY-RECORD.md`).

## Hard stops
Do not create the token, buy, transfer, or lock from this repository. It has no
keys and will not broadcast. If any check in FINAL-LAUNCH-CHECKLIST.md fails: STOP.

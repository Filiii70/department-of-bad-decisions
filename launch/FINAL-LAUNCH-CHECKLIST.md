# DBD FINAL LAUNCH CHECKLIST

DO NOT LAUNCH if any box is unchecked. If uncertain: STOP.

## Identity & metadata
- [ ] Name is exactly "Department of Bad Decisions"
- [ ] Ticker is exactly "DBD"
- [ ] Artwork correct (1000x1000, official Clerk/brand)
- [ ] Mayhem OFF
- [ ] DBD Creator wallet is the correct official wallet

## Members
- [ ] Member list closed at 2026-09-15 12:00 UTC
- [ ] `npm run members:validate` run; snapshot written; rejects reviewed
- [ ] Totals reconcile (eligible x 10,000 = member tokens)

## Economics (LOCKED)
- [ ] Founder = exactly 10,000,000 (1%)
- [ ] Zafir = exactly 25,000,000 (2.5%)
- [ ] Emmanuel = exactly 25,000,000 (2.5%)
- [ ] Member reward = exactly 10,000 each
- [ ] `npm run launch:obligations` total matches the plan

## Pump.fun
- [ ] Live verification re-run on launch day; nothing material changed
- [ ] `npm run launch:quote` reproduced and compared to the LIVE create-screen quote
- [ ] DBD Creator wallet funded (create+buy SOL + buffer)
- [ ] DBD Operations funded (ATA rent + lock fees + buffer)

## Moderator protection
- [ ] Zafir wallet present and valid in moderators.json
- [ ] Emmanuel wallet present and valid in moderators.json
- [ ] `npm run mods:locks` PASSES
- [ ] Lock mechanism confirmed in-app (docs/MODERATOR-LOCK-VERIFICATION.md items)
- [ ] 7-day protection semantics verified

## Website / transparency
- [ ] No false allocation claims remain (no "Team Allocation: None")
- [ ] Founder shown as 1%, mods as 2.5% each, member reward, 7-day protection
- [ ] No private personal information published (no Telegram usernames without consent)

## Distribution tooling
- [ ] `npm run members:distribute` dry-run succeeds and broadcasts nothing
- [ ] Batching correct; duplicate protection and resume verified by tests
- [ ] Mint guard refuses distribution while mint = NOT_YET_ISSUED

## Safety
- [ ] `npm test` green
- [ ] `npm run launch:simulate` green; production config still prelaunch / NOT_YET_ISSUED
- [ ] No private keys / seed phrases anywhere in the repo (secret scan green)
- [ ] Official CA publication flow ready; social accounts secure
- [ ] The create tx contains only the expected instructions

# Pump.fun live verification (for the 2026-09-15 DBD launch)

Retrieval date: 2026-09-12 (MUST be re-run on launch day, 2026-09-15, before signing).
Verifier: Claude Code.
Rule: the LIVE quote on the pump.fun create screen is the ground truth. Every
number below is for planning and MUST be re-checked against that screen.

## Sources checked

- Pump.fun bonding curve: https://pump.fun/docs/bonding-curve (fetched 2026-09-12)
- Pump.fun fees: https://pump.fun/docs/fees (fetched 2026-09-12)
- Pump.fun create-coin: https://pump.fun/docs/create-coin (fetched 2026-09-12)
- Prior in-repo verification: docs/launch-verification-2026-09.md (2026-09-07)

## Verified parameters

| Key | Value | Source | Notes |
|---|---|---|---|
| A. Create flow | Connect wallet, Create, one signed tx, live on curve immediately | create-coin docs | no hidden pre-trade phase |
| B. Create + initial buy | Optional dev buy bundled into the creation tx (SDK create_v2_and_buy / UI dev-buy field) | SDK + create screen | confirm the field on the live screen |
| C. Initial virtual token reserves | 1,073,000,000 (community/on-chain constant) | community | NOT officially published; re-verify on live quote |
| D. Initial virtual SOL reserves | 30 SOL (community/on-chain constant) | community | NOT officially published; re-verify on live quote |
| E. Total supply | 1,000,000,000 | docs | fixed |
| F. Buy fee | 1.25% total (creator 0.300% + protocol 0.950% + LP 0%) | fees docs | verified 2026-09-12 |
| G. Creator fee | 0.300% on curve; after graduation tiered 0.300% -> 0.050% by mcap | fees docs | |
| H. Mayhem | opt-in at creation only; DBD keeps it OFF | prior verification | confirm toggle OFF on screen |
| I. Slippage | set a max-slippage on the create+buy; large buys move price up the curve | curve docs | |
| J. Quote for N tokens | constant product: solIn = k/(vTok - N) - vSol, then +1.25% fee | curve docs + math | see scripts/lib/pumpfun-curve.js |
| K. Atomic create+buy | supported (single tx) | SDK | confirm current SDK/UI on the day |
| L. Sept 2026 changes | none blocking found on 2026-09-12 | docs | RE-CHECK on launch day |
| Creation cost | 0 SOL | fees docs | the SOL you need is the buy, not a fee |

## Planning figures (estimate, re-verify live)

For the full DBD launch obligation (founder 10M + mods 50M + members) the
create+buy SOL is estimated by `npm run launch:quote`. Example for 415 eligible
members (64,150,000 DBD = 6.415%): raw ~1.91 SOL, +1.25% fee ~0.024, total ~1.93,
with 15% buffer ~2.22 SOL. Plus ATA rent (~0.002 SOL per new member wallet) from
DBD Operations. These are ESTIMATES using unpublished community reserves.

## Launch-day action

1. Re-fetch the three doc URLs; confirm fee 1.25% and create cost 0.
2. Open the create screen, read the LIVE quote for the exact obligation token count.
3. If the live quote differs materially from the estimate, trust the screen.
4. Confirm Mayhem OFF, ticker DBD, name Department of Bad Decisions, 1000x1000 image.

# Moderator 7-day lock verification

Goal: protect each moderator's 25,000,000 DBD (2.5%) from being sold during the
first 7 days after launch, in a way that is public, verifiable on-chain, and NOT
dependent on personal promises (per the locked agreement and Philippe's own words).

Retrieval date: 2026-09-12. MUST be re-confirmed in-app during the dry-run before
launch. `scripts/prepare-moderator-locks.js` refuses to proceed unless this file
exists AND both moderator wallets are present and valid.

## Mechanism: Streamflow (Solana)

- Source: https://docs.streamflow.finance (fetched 2026-09-12).
- Verified: Streamflow offers, for SPL tokens on Solana, both a **Token Lock** and
  a **Vesting** product. This is the intended mechanism.
- Intended configuration per moderator:
  - amount: exactly 25,000,000 DBD
  - recipient: the moderator's own wallet
  - unlock: daily, linear, over 7 days (no big day-7 cliff), OR a straight 7-day
    lock then release — decide during the dry-run
  - cancelable: ON (so an unvested remainder returns to Treasury if a moderator leaves)

## MUST be confirmed in-app before launch (dry-run on devnet first)

These details were NOT fully readable from the public docs and must be confirmed
on the actual Streamflow app before creating the real locks:

1. The locked tokens are genuinely NOT transferable/sellable by the recipient
   during the agreed 7 days (true lock, not just a UI label).
2. Exact release behaviour after 7 days matches the agreement.
3. Current Streamflow fee (SOL) per lock/stream.
4. Cancelable semantics: who can cancel, and where the unvested remainder goes.
5. Solana mainnet is the active network and the DBD mint is supported.

## Blocker rule

If, on confirmation, Streamflow does NOT genuinely make the tokens unavailable for
the first 7 days, STOP and report. Do NOT silently substitute another mechanism;
bring the alternative (e.g. Bonfida token-vesting, or a time-locked escrow) back
to the human for an explicit decision.

## Status 2026-09-12

- Feature exists and fits the requirement: YES.
- Exact fee + release semantics confirmed in-app: NO (pending dry-run).
- Moderator wallets present: NO (Zafir + Emmanuel wallets still to be supplied).

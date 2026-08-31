# Wallet Policy

## Three wallets, three jobs

Use separate wallets. Do not use one wallet for everything. Separation limits
the blast radius if any single wallet is compromised, and it makes the on-chain
record readable to the public.

### Creator Wallet
- Purpose: creates the token and pays the launch transaction fees.
- Exposure: signs the one launch transaction, then should go quiet.
- Public address is published in config and on the site.

### Treasury Wallet
- Purpose: holds project funds (for example any allocation the project keeps).
- Exposure: receives and holds. It should sign rarely and deliberately.
- Public address is published in config and on the site.

### Operational Wallet
- Purpose: day-to-day small actions so the treasury stays cold.
- Exposure: highest activity, therefore the smallest balance. Treat it as hot.
- Optional. Publish its address only if you use one.

## Hard rules

- A private key or recovery phrase is never typed into this repository, never
  committed, never pasted into a terminal command here, and never sent to anyone.
- No person and no support agent will ever legitimately ask you for a recovery
  phrase. Anyone who does is attempting theft.
- Prefer a hardware wallet for the creator and treasury wallets.
- Keep the largest holdings in the least active wallet.

## Backups

Back up each wallet using its own app's official recovery flow, offline, on
paper or metal, stored physically. Backups never live inside this repository or
any cloud folder synced from it.

## Multisig (future option, not a V1 dependency)

A multisig on the treasury is a reasonable later upgrade: it requires multiple
signers to move funds, removing any single point of failure. It is deliberately
out of scope for V1 so the project can launch with zero extra dependencies and
zero extra cost. If adopted later, document the signer set and threshold here,
and keep every signer's secret material off this repository as always.

## What goes in config

Only the public addresses. That is the entire wallet footprint this project
keeps in code. See `../config/dbd.config.json`.

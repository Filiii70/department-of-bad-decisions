# $DBD Pump.fun Launch Package

Everything needed for the final manual coin creation on Pump.fun. This file
contains no private keys, seed phrases or wallet exports, and never will. The
creation transaction is signed by a human with the DBD Creator wallet. This repo
does not and cannot sign it.

Prepared against the current verified Pump.fun flow (see "Verified Pump.fun
requirements" below). Sources are official Pump.fun docs and the Pump.fun Web
Help Center.

---

## 1. Final coin metadata (paste exactly, all fields immutable after creation)

| Field | Value |
|-------|-------|
| Name | `Department of Bad Decisions` |
| Ticker / Symbol | `DBD` (3 chars, all caps: valid) |
| Image | `assets/brand/dbd-token-launch.png` (1000x1000, 1:1 PNG, 1.72 MB) |
| Website | `https://department-of-bad-decisions.pages.dev` |
| X / Twitter | `https://x.com/DBDDepartment` |
| Telegram | `https://t.me/DBDDepartment` |
| Mayhem | OFF (do not toggle it on) |

Machine-readable copy: `launch/pumpfun-metadata.json`.

### Final description (immutable, use verbatim)

```
Department of Bad Decisions ($DBD): bureaucratic satire on Solana. John, The Clerk, has reviewed your judgement. It was terrible. APPROVED. A parody meme coin built from public records. No utility, no roadmap, no promises, no guaranteed value, no presale. Just official forms, red stamps, and regret. Don't trust us. Verify us: https://department-of-bad-decisions.pages.dev
```

## 2. Canonical artwork

- Launch image: `assets/brand/dbd-token-launch.png`
  - 1000x1000 px, 1:1 square, PNG, ~1.72 MB. Meets Pump.fun's minimum
    (>= 1000x1000, <= 15 MB, square recommended).
  - This is the current John / The Clerk holding the APPROVED stamp under the
    "Department of Bad Decisions" badge. It is a lossless square + upscale of the
    canonical source `assets/brand/dbd-token.png`; the artwork itself is unchanged
    (no crop, no redesign).
- Source of truth (do not use older mascots): `assets/brand/dbd-token.png`.

## 3. Creator wallet (public address only)

- Creator wallet: `9tQxzr7NVS4FuxR2iHQ4McekjPdwF9j6Jy1ZrpHHVvRU`
- Treasury wallet: `BymiG3AzPu4jA7Aw4yrQD7qY6KXDUyEFtwN8z8WNQHsj`
- Operations wallet: `3h61d2Kyj4G2zRu66xzQpTA7tbV1gZHwDKGp9VUE6NYc`

Only the Creator wallet needs to connect and sign at creation. Never enter a seed
phrase or private key into any file, terminal or web prompt here.

## 4. Verified Pump.fun requirements (current)

- Creation flow: connect a Solana wallet (Phantom is the standard path) at
  pump.fun, click Create, fill fields, optionally set a dev buy, optionally toggle
  Mayhem, then approve one bundled transaction.
- Required inputs: Name, Ticker (3 to 6 chars, ALL CAPS), Image. Description and
  socials are optional but strongly expected; we provide all of them.
- Image spec: .png/.jpg/.gif, minimum 1000x1000, 1:1 square recommended,
  max 15 MB. Our launch image satisfies this.
- Social/link fields (website, X, Telegram): optional, and IMMUTABLE after
  creation. The contract is renounced on creation, so name, ticker, image,
  description and links cannot be edited later. Everything here must be final
  before signing.
- Creation fee: 0 SOL. If you attach an initial dev buy, budget roughly
  0.025 SOL total (network + account rent + your buy amount). Have a little more
  SOL than that in the Creator wallet for headroom.
- Signing: the server generates the mint keypair and partial-signs it; your
  connected wallet co-signs and submits a single bundled create (plus optional
  buy) transaction. The human wallet is a co-signer.
- Bonding curve: total supply 1B, ~800M on the curve; graduates automatically to
  PumpSwap (not Raydium) when the curve fills. Curve trading fee 1.25%.

## 5. Two configuration choices set at creation (in the Pump.fun UI)

Both are permanent and are chosen by the human at signing time. Neither can be
done by this repo.

1. Initial creator (dev) buy: OPTIONAL and configurable. You may launch holding
   0%. See "Creator buy decision" below for the exact choices and consequences.
2. Fee model (if prompted): Pump.fun now offers a permanent, on-chain choice at
   deploy between the standard Creator Fee and Trader Cashback. This is a one-time
   irreversible selection. Default guidance: standard Creator Fee unless you have a
   specific reason to route fees back to traders. Confirm the current wording in
   the app at creation.

## 6. Creator buy decision (the one strategic choice)

The dev buy is optional. Consequences of each choice:

- 0 SOL (no dev buy): cleanest, most transparent optics; you hold 0% at launch.
  Note the coin is not on-chain/publicly visible until the first buy by anyone,
  so someone (you or a community member) must make the first buy for it to appear.
- Small dev buy (for example ~0.1 to 1 SOL): you seed the curve and the coin is
  immediately live/visible; you hold a small transparent starting position that
  can be disclosed on the Verify page. Pays the standard 1.25% curve fee.
- Large dev buy: gives you a large early share. This reads as insider-heavy and
  contradicts the project's transparency stance. Not recommended.

We do not create hidden/sniper wallets, fake volume or fake holders. Whatever you
choose is done openly from the Creator wallet in the one signed transaction.

## 7. Pre-sign verification checklist

Before you approve the transaction, confirm every line:

- [ ] `npm test` and `npm run build` are green (already verified in the repo).
- [ ] `npm run prelaunch-check` STATUS is READY.
- [ ] Name is exactly `Department of Bad Decisions`.
- [ ] Ticker is exactly `DBD`.
- [ ] Image uploaded is `assets/brand/dbd-token-launch.png` (1000x1000 square).
- [ ] Description matches the verbatim block in section 1.
- [ ] Website / X / Telegram match the canonical values in section 1.
- [ ] Mayhem is OFF.
- [ ] The connected wallet is the Creator wallet
      `9tQxzr7NVS4FuxR2iHQ4McekjPdwF9j6Jy1ZrpHHVvRU`.
- [ ] Creator wallet holds enough SOL for the (optional) dev buy plus ~0.025 SOL.
- [ ] You have decided the dev buy amount (or 0) and the fee-model choice.
- [ ] You understand every field above is immutable once you sign.

## 8. Capture these AFTER creation (needed for the go-live update)

Copy directly from the transaction result / Pump.fun page. Do not retype the mint.

- Official mint address (base58): `______________________________________`
- Pump.fun token URL: `______________________________________`
- Creation transaction signature (if available): `______________________________`
- Exact launch time in ISO 8601 UTC (for example `2026-09-05T18:00:00Z`):
  `______________________________`

## 9. Go live in one command (post-creation, already prepared)

Once you have the mint and timestamp, the whole "go live" flip is a single
deterministic operation. It validates the mint, updates the canonical config
(`official_mint`, `launch_status=live`, `launch_timestamp`), appends a dated Bad
Decision Register entry, writes `launch/launch-log.json`, and prints the Solscan
link. It changes no wallets and touches no secrets.

```bash
# dry run first (writes nothing):
npm run apply-launch -- --mint <MINT> --timestamp <ISO8601Z> --url <PUMPFUN_URL> --sig <TX>

# then apply for real:
npm run apply-launch -- --mint <MINT> --timestamp <ISO8601Z> --url <PUMPFUN_URL> --sig <TX> --confirm

npm run build
npm run postlaunch-check
git add -A && git commit -m "Go live: publish \$DBD mint" && git push origin main
```

After the build, the mint is exposed on the Transparency (Verify) page and the
homepage Public Records form, the Solscan link resolves, and the anti-scam notice
is unchanged. Cloudflare Pages redeploys automatically on push.

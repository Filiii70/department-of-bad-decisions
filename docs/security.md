# Security Model

## Principles

1. This repository never needs a private key, a seed phrase, or any signing
   material to do its job. Every tool here is read-only.
2. Secrets never enter the repository. Not in code, not in config, not in `.env`.
3. The website is read-only. It cannot move funds, connect a wallet, or take
   user input in V1.
4. No hidden owner privileges exist anywhere in this codebase.

## What is public and what is secret

Public, and therefore fine to commit:
- Wallet addresses (creator, treasury, operational).
- The mint address, once it exists.
- Social links, website URL, explorer base URL, disclaimer text.

Secret, and therefore never committed anywhere:
- Private keys.
- Recovery phrases and mnemonics.
- Any exported wallet backup file.
- API secrets or tokens for paid services (none are required).

## Defenses in the repo

- `.gitignore` blocks `.env`, keypair files, wallet exports, PEM keys, and more.
- `scripts/lib/secret-scan.js` scans tracked files for key-like and phrase-like
  patterns and for a committed `.env`. The pre-launch checker runs it and fails
  hard on any finding.
- Scripts that would need a signer do not exist. There is nothing here to sign
  with, so there is nothing to leak.
- `.env.example` documents only a read-only RPC URL and a port. It contains no
  secret and is safe to commit.

## Fail-safe behavior

- Every network call in `solana.js` has a timeout and returns a structured
  failure. On error the tools print a reason and, where relevant, `UNAVAILABLE`.
  They never fabricate a value to appear healthy.
- The checkers exit non-zero on any critical failure so a broken state cannot be
  mistaken for a passing one in CI or a terminal.

## If a signer is ever added later

Any future feature that signs a transaction must:
- Load the signer only from a local, git-ignored source at runtime.
- Refuse to run, with a clear message, when no local signer is present.
- Never write the signer to disk inside the repository or log it.

This is a forward rule. V1 ships with no signing at all.

## Reporting

If you find a security issue, contact the project through the official channels
listed on the website. Do not post exploit details in public before maintainers
have had a chance to respond.

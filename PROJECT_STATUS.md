# DEPARTMENT OF BAD DECISIONS — PROJECT STATUS

Single source of truth. Snapshot of the **actual repository state**, not plans.

- **Audit date:** 2026-09-01
- **Git HEAD:** `b1f02f2` on `main` — remote `github.com/Filiii70/department-of-bad-decisions`
- **Tracked files:** 64
- **Uncommitted working-tree changes (real, present locally, NOT yet committed):**
  `site/scripts/eu-desk.js`, `site/src/data/eu-cases.json`, `site/src/eu-desk.html`, `site/styles/eu-desk.css` (the citizen-UX pass). The description below reflects the working tree, which is ahead of `b1f02f2`.
- This document is a snapshot and goes stale on the next change. Re-generate after material work.

---

## 1. BRAND

| Item | Current confirmed value | Status |
|------|-------------------------|--------|
| Project name | Department of Bad Decisions | DONE |
| Ticker | $DBD | DONE |
| Tagline(s) | EU Desk: "They run Europe. We pay." / "Power. Money. Connections. Properly filed." / "We keep the receipts." · Master: "Your judgement has been reviewed. It was terrible. APPROVED." | DONE |
| John / The Clerk | Canonical illustrated clerk (`assets/clerk.png`), editorial name "John". Visual identity locked; used on homepage, Belgian Desk, EU Desk | DONE |
| Visual identity | Aged cream/government-document system; red APPROVED stamps; big distressed Belgian flag (Belgian Desk) and EU flag (EU Desk); reusable CSS components | DONE |
| EU Desk positioning | Primary launch editorial focus (public-record satire: money/power/connections/investigations/aftermath) | DONE |

No open brand decisions. **DECISION NEEDED:** none for brand.

---

## 2. WEBSITE

Static, zero-dependency site built from `site/` into `site/dist/`. Routing is static files + client-side `?case=` query. **No transparency/verify page and no standalone anti-scam page exist as separate routes** (both live as sections).

| Page / route | Purpose | Status | Production-ready | Major missing item |
|--------------|---------|--------|------------------|--------------------|
| `/index.html` (homepage) | Department identity, The Clerk, "Files under review", $DBD/token record, public wallet register, transparency, fraud office, bulletins, legal | DONE | Partly (placeholders in wallets/socials/mint) | Real wallet/social/mint values |
| `/eu-desk.html` | EU Desk archive: hero, John, EU case files | DONE | Yes (content), pending real socials | — |
| `/eu-desk.html?case=DBD-EU-XXXX` | Full EU dossier: citizen summary (What happened / Where's the money / What happened to them / John), Who Knows Who, "Show the full file" (money, people, investigation, timeline, sources) | DONE | Yes | — |
| `/belgian-desk.html` | Belgian Desk archive (National archive, Belgium) | DONE | Yes | Not on the citizen-UX pattern yet |
| `/belgian-desk.html?case=DBD-BE-XXXX` | Belgian dossier (fact/satire, sources) | DONE | Yes | Older layout (no 3-question citizen card / no Who-Knows-Who) |
| Transparency | Homepage FORM DBD-003 section (GitHub, launch status, config version, last updated) | PARTIAL | No | Real links; no dedicated verify page |
| Anti-scam | Homepage "Case File: Fraud Prevention" section + config disclaimer | DONE (as content) | Yes | Real official-links to verify against |
| Token section ($DBD) | Homepage "Office of Questionable Financial Decisions" + FORM DBD-001 token record + wallet register | PARTIAL | No | Real mint + wallets (all placeholders) |

Build output `site/dist/` is git-ignored (generated).

---

## 3. EDITORIAL CONTENT

### In production data (real, published)

| Case ID | Name | Research | Citizen summary | Source quality | Legal-status freshness | Who Knows Who | Publish-ready |
|---------|------|----------|-----------------|----------------|------------------------|----------------|---------------|
| DBD-EU-0001 | Qatargate | DONE (deep) | DONE | Primary EP OEIL + strong secondary | Current to 2026-02-20 (verified 2026-09-01) | DONE (7 nodes, sourced edges) | YES |
| DBD-EU-0002 | Huaweigate | DONE (deep) | DONE | Primary EP OEIL procedure files + prosecutor-via-press | Current to 2026-06-16 (verified 2026-09-01) | DONE (8 nodes, sourced edges) | YES |
| DBD-BE-0001 | Oosterweel Link (Antwerp) | DONE | PARTIAL (has plan/outcome/summary, not the new 3-question citizen card) | Primary Rekenhof report + Lantis/parliament | Current to 2026-03-26 (verified 2026-08-31) | N/A (Belgian model has no network) | YES |

### Researched but NOT built (audit only — not in production)

Candidate pool of 10 exists as an internal research audit. Verified and recommended but **not yet built as dossiers**: Frontex/Leggeri, Agrofert/Babiš, Pfizergate (moved to HOLD/reserve), plus HOLD candidates (GEA allowance, Dalligate, Barroso–Goldman Sachs, Voice of Europe/Kroes). **Nathan Gill (Voice of Europe)** verified as a clean conviction-based candidate for a future DBD-EU-0003 (CPS + Counter Terrorism Policing primary sources) — **not built**.

---

## 4. TRUST / TRANSPARENCY

| Item | Status | Note |
|------|--------|------|
| Public GitHub repo | DONE (exists) | `github.com/Filiii70/department-of-bad-decisions`, main @ b1f02f2. Public/private visibility not verifiable from the local clone — VERIFY on GitHub |
| README suitable for public visitors | PARTIAL | Strong README, but developer-oriented (install/build/checks), not a visitor landing explainer |
| Founder identification | NOT STARTED | No founder identity anywhere in the repo |
| Official mint field | PARTIAL | Field exists (`official_mint`), value = `NOT_YET_ISSUED` (correct pre-launch) |
| Creator wallet | PARTIAL | Field exists, value = `REPLACE_ME_CREATOR_WALLET` (placeholder) |
| Treasury wallet | PARTIAL | Field exists, value = `REPLACE_ME_TREASURY_WALLET` (placeholder) |
| Operational wallet | PARTIAL | Field exists, value = "" (empty; optional) |
| Allocation policy | NOT STARTED | No token allocation/distribution policy documented |
| Presale statement | NOT STARTED | None |
| Private-round statement | NOT STARTED | None |
| Mint authority information | NOT STARTED | Not documented (no supply/authority fields in config) |
| Freeze authority information | NOT STARTED | Not documented |
| Launch policy | DONE | `launch/launch-checklist.md` + `launch/manual-launch-runbook.md` (manual, creator-wallet only) |
| Public transaction/treasury ledger | NOT STARTED | `monitoring/monitor.js` can emit JSON, but no public ledger page/feed exists |
| Anti-scam instructions | DONE | Homepage Fraud Office section + config disclaimer (one official mint, verify, never asks for seed phrase) |
| Official-links registry | PARTIAL | Fields exist (X/Telegram/GitHub/website) but all are placeholders |
| Changelog | NOT STARTED | No CHANGELOG; only `config_version` field |
| Bad Decision Register | PARTIAL | Homepage "Bad Decision of the Day" bulletin exists; the case-file archive is the de-facto register, but no named "Bad Decision Register" artifact |

---

## 5. SOCIALS

| Channel / asset | State | Note |
|-----------------|-------|------|
| X account | NOT STARTED | Only a placeholder URL in config |
| Telegram | NOT STARTED | Only a placeholder URL in config |
| GitHub | LIVE (repo) | Real repo exists; the config `official_github` still a placeholder |
| Website URL | NOT STARTED | `official_website` is a placeholder; no domain |
| Profile image | PREPARED | `assets/brand/avatar-x.png`, `avatar-telegram.png` exist (cut from brand sheet) |
| Banner | PREPARED | `assets/brand/banner.png` exists |
| Bio | NOT STARTED | Not written |
| Pinned post | NOT STARTED | None |
| Initial post inventory | NOT STARTED | No posts drafted (case cards are structured to become social cards, but none exported) |

---

## 6. TOKEN / PUMP.FUN

| Item | Status |
|------|--------|
| Token created? | NO (none) |
| Mint address? | NONE (`official_mint = NOT_YET_ISSUED`) |
| Pump.fun page? | NONE |
| Creator wallet configured? | Field present, value = placeholder |
| Treasury wallet configured? | Field present, value = placeholder |
| Launch scripts/status? | `scripts/prelaunch-check.js`, `scripts/postlaunch-check.js`, `scripts/solana-util.js`, `monitoring/monitor.js` present; `launch_status = prelaunch` |
| Prelaunch checker | DONE (exists) |
| Postlaunch checker | DONE (exists, blocks until a real mint is set) |
| Supply configuration | NOT STARTED (no supply field in config) |
| Launch policy documented | DONE (manual runbook + checklist; launch platform `pump.fun` named) |

No token interaction has occurred or is configured to occur automatically.

---

## 7. SECURITY

| Item | Status |
|------|--------|
| Secrets scan | PASS — `tests/eu-desk.test.js`/`secret-scan` clean across the repo (part of the 41 passing tests) |
| `.env` status | No `.env` tracked; only `.env.example` (RPC URL + port, no secret) |
| Private keys | ABSENT |
| Seed phrases | ABSENT |
| Sensitive files excluded | `.gitignore` blocks `.env`, keypairs, `*.key/*.pem/*.p12`, wallet exports, node_modules, dist, monitoring output |
| Current GitHub visibility | Repo exists; public/private NOT confirmed from local clone — VERIFY |

---

## 8. INFRASTRUCTURE

| Item | Value |
|------|-------|
| Framework / build system | Custom zero-dependency static generator (Node ≥18); no Astro/Vite/framework; no npm dependencies |
| Build command | `npm run build` (→ `node scripts/build-site.js`, outputs `site/dist/`) |
| Test command | `npm test` (→ `node --test --test-concurrency=1 "tests/**/*.test.js"`) |
| Current test count / result | 41 tests, 41 pass, 0 fail (last run this session) |
| Deployment configuration | NONE in repo (no Netlify/Vercel/Cloudflare config committed) |
| Domain status | NONE (website URL is a placeholder) |
| Cloudflare Pages status | NOT CONFIGURED |

Local toolchain note: Node is installed at `C:\Program Files\nodejs` (not always on the shell PATH).

---

## 9. CURRENT BLOCKERS (max 10)

1. **No public domain / deployment.** The site only runs locally; nothing is hosted. No Cloudflare Pages / host configured.
2. **All official links are placeholders** (X, Telegram, website, config `official_github`) — nothing to point the public or the anti-scam section at.
3. **Wallets are placeholders** (creator/treasury). No real public addresses to publish.
4. **No public-visitor README/landing explainer** — current README is developer-focused.
5. **GitHub visibility unconfirmed** (public vs private) — must be public for a credible open project.
6. **Token trust layer undocumented** (allocation, presale/private-round, mint & freeze authority, supply) — expected questions on any Solana launch are unanswered.
7. **Belgian Desk not on the citizen-UX pattern** — inconsistent reading experience vs EU Desk.
8. **No social launch inventory** (bio, pinned post, first posts) despite prepared avatar/banner assets.
9. **Citizen-UX pass is uncommitted** — real work exists only in the working tree (not in `b1f02f2`); at risk until committed.
10. **No changelog / no dated "single source of truth" beyond this file** — parallel workstreams are hard to track.

---

## 10. NEXT ACTION

**Deploy the current static site to a public URL (e.g. Cloudflare Pages) from the `site/dist` build, and set that domain as `official_website`.**

Rationale: the strongest asset (two fully-sourced EU dossiers with a citizen-readable front) currently exists only on localhost. A single public URL turns the whole project from "internal repo" into a shareable, verifiable public presence — and it is the precondition for socials, the anti-scam "verify here" promise, and any pre-launch credibility. Everything else (real wallets, social copy, more cases) can follow once there is a public home.

---

FILES CHANGED: PROJECT_STATUS.md only

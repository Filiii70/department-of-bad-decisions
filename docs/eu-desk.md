# The European Union Desk

The launch editorial focus of the Department of Bad Decisions.

> They run Europe. We pay. Power. Money. Connections. Properly filed.

A public-record satire system that lets an ordinary citizen follow **the money,
the power, the connections, the investigation, and what happened next** in EU
accountability cases. It is not activism, not partisan, not conspiracy content.
Facts are sourced and dated; **John** supplies the satire after the record.

## The one editorial rule

Two layers, always structurally separated:

- **The record** (sourced facts) and **What is alleged** (clearly not proven).
- **John's Assessment** (satire) never makes a factual or criminal claim.

Legal status is never blurred. These labels are not interchangeable and are
enforced in code (`site/scripts/lib/eu.js`): `ALLEGED`, `UNDER INVESTIGATION`,
`IMMUNITY LIFTED`, `CHARGED`, `ON TRIAL`, `CONVICTED`, `ACQUITTED`,
`CASE DISMISSED`, `COOPERATING WITNESS`, `STATUS UNKNOWN FROM PUBLIC RECORD`, etc.
"Investigated" is never rendered as "guilty".

## Architecture (no backend)

Mirrors the Belgian Desk pattern, reusing the existing static build.

- Page: `site/src/eu-desk.html` -> `dist/eu-desk.html`
- Styles: `site/styles/eu-desk.css` (scoped under `body.eu`, EU blue/yellow, big
  distressed EU-flag backdrop `assets/eu-flag.svg`)
- Logic: `site/scripts/eu-desk.js` (ES module)
- Shared library + validators: `site/scripts/lib/eu.js`
- Data: `site/src/data/eu-cases.json` (production; only fully-verified cases)
- Dev fixture: `tests/fixtures/eu-cases.sample.json` (never shipped, never rendered)

Routes: `/eu-desk.html` (archive), `/eu-desk.html?case=DBD-EU-0001` (full dossier).

## Enforced editorial rules (see `tests/eu-desk.test.js`)

- A money amount requires a **classification** AND a **source**.
- A network edge requires a **source** (unsourced edges never render).
- A person's **allegation can never silently become an established finding**
  (`establishedFindings` is rejected unless `proceduralStatus` is `CONVICTED` or
  `MALADMINISTRATION FINDING`).
- A case's legal status requires a **`currentStatus.lastVerified`** date.
- Every **investigation-timeline event requires a source**.
- Production ships no sample/unfinished allegations.
- Satire is structurally separate from factual content.

## Case data model (key blocks)

`caseNumber` (DBD-EU-0000), `title`, `institutions[]`, `category`,
`executiveSummary`, `whatIsAlleged`, `whatIsEstablished`,
`money[]`, `people[]`, `network{nodes,edges}`, `investigation[]`, `timeline[]`,
`whatHappenedNext[]`, `currentStatus{statusLabel,lastProceduralEvent,date,authority,lastVerified,sourceIds}`,
`statusHistory[]`, `sources[]` (ledger), `claims[]` (internal claim ledger),
`clerkAssessment{}` (John, satire), `johnNotes`, `lastVerified`.

- **Money record**: `{amount|"NOT_DOCUMENTED", currency, classification, description, recipient, payer, date, sourceIds}`.
  Classifications include SEIZED CASH, ALLEGED PAYMENT, ALLEGED BRIBE,
  CONTRACT VALUE, PUBLIC EXPENDITURE, EU FUNDING, AMOUNT CLAIMED, AMOUNT RECOVERED,
  ESTIMATED FRAUD, ESTABLISHED IRREGULARITY, COURT-ESTABLISHED LOSS. A giant euro
  number is never shown without saying what it represents.
- **Person record**: `{name, publicRole, roleAtTime, institution, caseRole, proceduralStatus, allegations[], establishedFindings[], currentStatus, lastVerified, sourceIds}`.
- **Network**: `nodes[{id,label,nodeType}]`, `edges[{from,to,relationshipType,description,sourceIds|sourceURL,sourceDate}]`.
  A line means only what its label says; a connection is not an accusation.
- **Source ledger**: `{sourceId, sourceType, institution, title, publicationDate, sourceURL, accessDate, language, primaryOrSecondary, claimsSupported[]}`.

## Legal status is updateable

These cases evolve. Update `currentStatus`, `statusHistory`, per-person
`proceduralStatus`/`currentStatus`/`lastVerified`, and add the new source, without
rewriting the dossier prose. Never bake a stale status into the summary.

## How to add / update a case

1. Research against primary sources (courts, EPPO, OLAF, national prosecutors,
   European Parliament, Commission, Court of Auditors, Ombudsman).
2. Add/patch the object in `site/src/data/eu-cases.json`. Classify every amount,
   set each person's exact `proceduralStatus`, source every edge, set
   `currentStatus.lastVerified`.
3. `npm run build`; open `/eu-desk.html?case=DBD-EU-XXXX`.
4. `npm test` (validators block missing classifications/sources/status dates).

## John

John is the canonical Clerk, visually unchanged. Editorial name: **John**.
He reads the paperwork, checks the receipts, follows the connections, stamps the
file. He does not make criminal findings. Deadpan, tired, precise. Never
campaigns, never calls anyone corrupt unless it is an established legal fact.

## Belgian Desk

Preserved and unchanged. Conceptually it becomes National Archives -> Belgium
later. Not expanded during the EU launch focus.

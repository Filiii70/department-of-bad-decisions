# The Belgian Desk

An editorial division of the Department of Bad Decisions: a satirical public
record archive of documented Belgian governmental blunders, wasted public money
and administrative absurdity. It is an expansion of DBD, not a replacement. The
Solana Division and `$DBD` remain the master brand, and The Clerk remains the one
permanent character.

> PUBLIC FACTS. POOR JUDGEMENT. PROPERLY FILED. APPROVED.

## The one editorial rule

Every case has two clearly separated layers:

1. **Public Record (facts)** - supported by public sources. Never fabricated.
2. **Department Commentary (satire)** - written in the voice of The Clerk.

The UI makes the distinction unmistakable: the fact layer is a plain sourced
sheet labelled `PUBLIC RECORD · SOURCED`; the satire layer is a red, dashed
`DEPARTMENT COMMENTARY · EDITORIAL SATIRE` block. Satire is never allowed to
masquerade as a sourced fact, and "satire" is never an excuse to invent factual
allegations.

## Architecture (no new backend)

The Belgian Desk reuses the existing zero-dependency static architecture.

- Page: `site/src/belgian-desk.html` -> built to `dist/belgian-desk.html`.
- Styles: `site/styles/belgian-desk.css` (loaded after `main.css`, scoped under
  `body.belgian`, so the core DBD identity is untouched).
- Logic: `site/scripts/belgian-desk.js` (ES module, read-only, no backend).
- Shared library: `site/scripts/lib/belgian.js` (enums, validators, formatters)
  imported by BOTH the browser page and the Node tests, so validation is
  identical everywhere.
- Data: JSON files under `site/src/data/` -> `dist/data/`.

No database, no login, no wallet connection, no tracking, no API dependency.

## Routes

- `/belgian-desk.html` - the archive (hero, editorial notice, filters, case grid,
  bulletins, submit concept).
- `/belgian-desk.html?case=DBD-BE-0001` - a single, shareable case file page.
- `?preview=dev` - force development sample data on (also on by default on
  localhost). `?preview=prod` - force the true public view (no samples).

## Data files

| File | Purpose |
|------|---------|
| `site/src/data/belgian-cases.json` | Published cases. **Empty in V1.** Only real, sourced cases go here. |
| `site/src/data/belgian-bulletins.json` | Published short bulletins. Empty in V1. |
| `site/src/data/belgian-cases.sample.json` | DEVELOPMENT SAMPLE only. Loaded on localhost, never rendered in production. Entries are clearly fictional and flagged `sample: true`. |
| `site/src/data/belgian-bulletins.sample.json` | DEVELOPMENT SAMPLE bulletins. |

Production never renders anything flagged `sample: true` (guarded in code and in
tests). The archive shows an honest empty state until real cases are filed.

## Case data structure

```json
{
  "caseNumber": "DBD-BE-0001",            // must match DBD-BE-0000
  "title": "…",
  "subtitle": "…",
  "status": "FILED",
  "institution": "…",
  "governmentLevel": "FEDERAL",           // FEDERAL|FLEMISH|WALLOON|BRUSSELS|PROVINCIAL|MUNICIPAL|EU|OTHER
  "location": "…",
  "date": "2026-01-15",
  "year": 2026,
  "people": ["…"],                        // only when factually relevant AND sourced
  "politicalParties": ["…"],
  "category": "PUBLIC MONEY",             // see CATEGORIES in lib/belgian.js
  "intended": "What it was supposed to do (sourced).",   // optional
  "actual": "What actually happened (sourced).",          // optional
  "summary": "What the public record documents.",
  "publicMoney": {
    "currency": "EUR",
    "originalBudget": 1000000,
    "currentEstimate": 10000000000,       // optional: for ongoing projects, current sourced estimate
    "finalCost": 3400000,
    "amountPaid": 3400000,
    "amountRecovered": 0,
    "documentedLoss": 2400000,
    "currentStatus": "…"
  },
  "documentedOutcome": "…",
  "timeline": [{ "date": "2024-03-01", "event": "…" }],
  "sources": [{
    "sourceName": "Belgian Court of Audit",
    "sourceTitle": "…",
    "sourceType": "COURT OF AUDIT",       // COURT OF AUDIT|PARLIAMENT|GOVERNMENT|JUDGMENT|OFFICIAL REPORT|PROCUREMENT|MEDIA
    "sourceURL": "https://…",
    "publicationDate": "2026-01-10",
    "accessDate": "2026-01-12"
  }],
  "clerkAssessment": {                     // SATIRE ONLY
    "financialJudgement": "Questionable.",
    "administrativeCompetence": "Under administrative review.",
    "paperworkGenerated": "Exceptional.",
    "accountabilityStatus": "Please contact another department.",
    "lessonsLearned": "Pending.",
    "departmentVerdict": "APPROVED."
  },
  "departmentNotes": "…",                  // satire
  "illustration": { "src": "./assets/…", "alt": "…", "caption": "…" },
  "tags": ["…"],
  "publishedDate": "2026-01-15",
  "updatedDate": "2026-01-15"
}
```

All fields are optional except `caseNumber` and `title`. Missing money fields are
omitted (or shown as `NOT DOCUMENTED` if the value is the literal string
`"NOT_DOCUMENTED"`). Zero is only ever shown when it is a real documented value in
the data; it is never substituted for missing data.

## How to add a real Belgian case

1. Confirm the facts against a public source (Court of Audit / Rekenhof,
   a parliament, an official audit, a judgment, procurement records, or reputable
   journalism reporting documented facts).
2. Append an object to `site/src/data/belgian-cases.json` following the structure
   above. Give it the next `DBD-BE-XXXX` number.
3. Put only sourced facts in the factual fields. Put every opinion, verdict and
   joke in `clerkAssessment` / `departmentNotes`.
4. Attach at least one source. A case that states any factual content with no
   source fails validation and will not render (see the editorial rule).
5. `npm run build`, then open `/belgian-desk.html?case=DBD-BE-XXXX` to check it.
6. `npm test` to validate all case data.

## How sources attach to a case

Sources live in the case's `sources` array. Each is rendered by the
`SourceRecord` component with its type badge, name, title, a clickable URL, and
publication/access dates. The `lib/belgian.js` validator requires each source to
have a name and a valid `http(s)` URL, and requires at least one source whenever
a case states facts.

## How satire and facts are separated (visually and in code)

- Facts render inside `.layer.layer-fact` (`PUBLIC RECORD · SOURCED`).
- Satire renders inside `.layer.layer-satire` (`DEPARTMENT COMMENTARY · EDITORIAL
  SATIRE`, red dashed, plus the note "These assessments are editorial satire, not
  sourced facts.").
- In the data model, facts live in `summary`, `documentedOutcome`, `people`,
  `publicMoney`, `timeline`, `sources`. Satire lives in `clerkAssessment` and
  `departmentNotes`. The two never share a field.

## Editorial policy

- **Political neutrality.** The Belgian Desk targets no party. Any party,
  government level, institution or public figure can be a subject when supported
  by a documented public case. The joke is that the Department approves
  everyone's bad decisions equally.
- **Real public figures** appear only inside individual cases/bulletins, only
  when genuinely relevant to a documented matter, and are never added to the
  master brand or logo. The permanent face is The Clerk.
- **Never invent** crimes, corruption, fraud, enrichment, conflicts of interest,
  quotations, conduct, amounts or motives. If a public source documents it, the
  factual layer may describe it accurately; the satire layer may then comment.

## Components (design-system)

`BelgianDeskHeader`, `BelgianCaseFile`, `BelgianBulletin`, `PublicMoneyRecord`,
`SourceRecord`, `ClerkAssessment`, `BelgianApprovedStamp`, `CaseTimeline`,
`CaseArchive`, `EditorialNotice`, `PoliticalIllustrationFrame`. They are
implemented as documented CSS classes plus DOM-builder functions in
`belgian-desk.js`, reusing existing DBD components (`.stamp`, `.gov-form`,
`.field`, `.clerk-frame`, masthead, filetabs, footer) wherever sensible.

## Illustrations

`PoliticalIllustrationFrame` (`.illus-frame`) is a 16:9 slot that accepts future
approved artwork via a case's `illustration.src`. Until then it shows an empty
"approved artwork pending" placeholder without breaking layout. Artwork must
follow the DBD vintage ink / halftone style and keep The Clerk visually
consistent. No political images are fetched or generated automatically.

## Language

Primary language is English for now. Editorial strings are kept in the data
layer (not hardcoded deep in components), so Dutch/French translations can be
added later without rewriting the application.

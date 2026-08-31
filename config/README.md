# Configuration

`dbd.config.json` is the single canonical source of truth for the whole project.
The website, the checkers, the Solana utilities and the monitor all read from it.
Do not duplicate these values anywhere else.

## Placeholder convention

Any value containing `REPLACE_ME`, `TODO`, `.example`, or the literal
`NOT_YET_ISSUED` is a placeholder that a human must review before launch.
The pre-launch checker reports every placeholder it finds. This is intentional:
the repository ships honest placeholders, never fake production values.

## Fields

| Field | Meaning | Notes |
|-------|---------|-------|
| `config_version` | Version of this config document | Bump on any change |
| `last_updated` | ISO 8601 timestamp of last edit | Shown on the site |
| `project_name` | Must be exactly `Department of Bad Decisions` | Checked |
| `ticker` | Must be exactly `DBD` | Checked |
| `network` | Must be `solana` | Checked |
| `launch_status` | `prelaunch` before launch, `live` after | Drives the site |
| `launch_platform` | Where the token is launched, e.g. `pump.fun` | |
| `launch_timestamp` | ISO 8601 launch time, or `null` before launch | Set at launch |
| `official_mint` | `NOT_YET_ISSUED` before launch, real base58 mint after | Never fake it |
| `creator_wallet` | Public address that creates the token | Public info only |
| `treasury_wallet` | Public address holding project funds | Public info only |
| `operational_wallet` | Optional day-to-day wallet, or `""` | Public info only |
| `official_x` | Full URL to the official X profile | Format checked |
| `official_telegram` | Full URL to the official Telegram | Format checked |
| `official_github` | Full URL to this repository | Format checked |
| `official_website` | Full URL to the official website | Format checked |
| `explorer_base_url` | Base URL of the block explorer, e.g. Solscan | Used for links |
| `disclaimer_text` | Legal / anti-scam disclaimer shown on the site | Must be present |

## Transition to live

At launch you change exactly three things and nothing else:

1. `launch_status` -> `"live"`
2. `official_mint` -> the real mint address printed by the launch transaction
3. `launch_timestamp` -> the real ISO 8601 launch time

Then bump `config_version`, update `last_updated`, rebuild the site, and run the
post-launch checker. See `../launch/manual-launch-runbook.md`.

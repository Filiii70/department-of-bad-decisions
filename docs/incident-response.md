# Incident Response

For every incident: Detection, Immediate action, Public communication, Recovery.
Keep messaging calm, factual, and pointed at the single official mint and the
official channels. Never ask users for secrets in any communication.

---

## 1. Fake token appears (same name or ticker)

- Detection: monitoring, community reports, or an explorer search surfaces a
  token using the DBD name or ticker with a different mint.
- Immediate action: verify your official mint against the website. Do not
  interact with the fake. Screenshot it for the record.
- Public communication: restate the one official mint address and link to the
  website's anti-scam section. Do not link the fake token directly.
- Recovery: keep the official mint prominent everywhere. Report the impostor to
  the explorer and the launch venue if they have a report flow.

## 2. Fake X account

- Detection: an account impersonates the project's handle or name.
- Immediate action: confirm your real handle in config matches the site.
- Public communication: from the verified account, name the real handle and warn
  about the impostor. Ask followers to report it.
- Recovery: file a platform impersonation report. Keep the real handle linked on
  the website so users can always find the source of truth.

## 3. Fake Telegram

- Detection: a group or admin impersonates the project.
- Immediate action: confirm the official Telegram link in config and on the site.
- Public communication: warn that admins never DM first and never ask for
  secrets or wallet connections.
- Recovery: report the fake group. Pin the official link and anti-scam rules.

## 4. Website compromise

- Detection: the site shows a mint or content that does not match the canonical
  config, or an unexpected script appears.
- Immediate action: take the site offline or roll back to the last known-good
  `site/dist`. The site is static, so redeploying a clean build is fast.
- Public communication: tell users to stop trusting the site until restored, and
  to verify the mint via the explorer in the meantime.
- Recovery: rebuild from a clean clone, run `prelaunch-check` or
  `postlaunch-check`, redeploy, rotate any host credentials.

## 5. GitHub compromise

- Detection: unexpected commits, changed config, or new collaborators.
- Immediate action: revoke suspicious access, reset repository permissions,
  enable or reset two-factor on the account.
- Public communication: note the incident and confirm which commit is the last
  trusted one.
- Recovery: force the repository back to the last trusted commit, rebuild and
  redeploy the site, audit the diff for any injected mint or link change.

## 6. Wallet compromise

- Detection: an unexpected transaction from creator, treasury, or operational.
- Immediate action: move remaining funds to a fresh, secure wallet you control.
  Assume the compromised wallet is fully lost.
- Public communication: state which wallet is affected and publish the new
  address, updated in config and on the site.
- Recovery: rotate to the new wallet, update config, rebuild, redeploy, and run
  `postlaunch-check` to confirm the site shows the corrected addresses.

## 7. Wrong mint published

- Detection: the site or a post shows a mint that is not the real one.
- Immediate action: correct `official_mint` in config, rebuild, redeploy. Delete
  or correct the wrong post.
- Public communication: clearly state the correct mint and that the previous one
  was an error. Point to the explorer for confirmation.
- Recovery: run `postlaunch-check` to confirm the site matches the real on-chain
  mint. Review how the wrong value got in and tighten the process.

## 8. Suspicious transfer

- Detection: `monitor` or an explorer alert shows an unusually large transfer or
  a sudden concentration change.
- Immediate action: confirm which wallet moved and whether it was authorized.
- Public communication: if it involves an official wallet, explain what happened
  factually. If it is an unrelated holder, no action beyond noting it.
- Recovery: if unauthorized, treat as a wallet compromise. Otherwise record the
  baseline and keep monitoring.

## 9. RPC unavailable

- Detection: tools report `UNAVAILABLE` or timeouts.
- Immediate action: retry. If it persists, set `SOLANA_RPC_URL` to a different
  public endpoint and rerun.
- Public communication: usually none needed; this is an infrastructure hiccup,
  not a project incident.
- Recovery: once an endpoint responds, rerun the checkers and monitor. Never edit
  config to fake a passing result while RPC is down.

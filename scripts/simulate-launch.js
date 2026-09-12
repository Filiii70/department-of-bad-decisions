// Full dry launch simulation. Runs the entire OFF-CHAIN pipeline against sample
// data and writes clearly-labelled SIMULATION artifacts. Creates no token, sends
// nothing, signs nothing, and asserts the production config stays pre-launch.
//
// Usage: node scripts/simulate-launch.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCsv, validateSubmissions } from './lib/member-snapshot.js';
import { computeObligations } from './lib/launch-obligations.js';
import { quoteBuy, roundSol } from './lib/pumpfun-curve.js';
import { planDistribution } from './distribute-member-rewards.js';
import { validateModerators } from './prepare-moderator-locks.js';
import { reconcile } from './reconcile-launch.js';
import { loadConfig, MINT_NOT_ISSUED } from './lib/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'launch/generated/simulation');
const BANNER = '> SIMULATION ONLY - sample data, no token created, nothing sent.\n';

export function runSimulation({ submissionsCsv, moderatorsDoc }) {
  const { rows } = parseCsv(submissionsCsv);
  const { rows: validated, totals } = validateSubmissions(rows);
  const eligible = validated.filter((r) => r.eligible);
  const obligations = computeObligations(totals.eligible);
  const quote = quoteBuy(obligations.total, { bufferPct: 15 });
  const distribution = planDistribution(eligible, { paid: {} });
  const modCheck = validateModerators(moderatorsDoc);
  const rec = reconcile({ eligibleCount: totals.eligible, ledger: { paid: {} }, moderators: moderatorsDoc, mint: MINT_NOT_ISSUED });
  return { totals, obligations, quote, distribution, modCheck, rec };
}

function main() {
  // Guard: production config must remain pre-launch. Refuse to "simulate" if the
  // real config has already been switched to live / a real mint.
  const cfg = loadConfig();
  if (cfg.launch_status !== 'prelaunch' || cfg.official_mint !== MINT_NOT_ISSUED) {
    console.error('REFUSED: production config is not pre-launch. Simulation aborted to avoid confusion.');
    console.error(`  launch_status=${cfg.launch_status} official_mint=${cfg.official_mint}`);
    process.exit(1);
  }

  const sampleSub = resolve(ROOT, 'tests/fixtures/member-submissions.sample.csv');
  const sampleMods = resolve(ROOT, 'tests/fixtures/moderators.sample.json');
  if (!existsSync(sampleSub) || !existsSync(sampleMods)) {
    console.error('Missing sample fixtures for simulation.');
    process.exit(1);
  }

  const sim = runSimulation({
    submissionsCsv: readFileSync(sampleSub, 'utf8'),
    moderatorsDoc: JSON.parse(readFileSync(sampleMods, 'utf8')),
  });

  mkdirSync(OUT, { recursive: true });

  writeFileSync(resolve(OUT, 'MEMBER-SNAPSHOT-REPORT.md'),
    `# [SIMULATION] Member Snapshot\n${BANNER}\n- Submissions: ${sim.totals.submissions}\n- Eligible: ${sim.totals.eligible}\n- Invalid: ${sim.totals.invalid_wallets}\n- Duplicates (wallet/user): ${sim.totals.duplicate_wallets}/${sim.totals.duplicate_usernames}\n- Member tokens: ${sim.totals.member_tokens_total.toLocaleString('en-US')} DBD\n`);

  writeFileSync(resolve(OUT, 'WALLET-FUNDING-PLAN.md'),
    [`# [SIMULATION] Wallet Funding Plan`, BANNER,
      '## DBD Creator (creation + initial acquisition)',
      `- Tokens to acquire: ${sim.obligations.total.toLocaleString('en-US')} DBD (${sim.obligations.percentOfSupply.toFixed(4)}%)`,
      `- Estimated create+buy SOL (raw+fee): ${roundSol(sim.quote.totalSol)} SOL`,
      `- Recommended with 15% buffer: ${roundSol(sim.quote.withBuffer)} SOL`,
      `- Creation fee: 0 SOL (pump.fun)`,
      '',
      '## DBD Operations (distribution + locks)',
      `- Member airdrop ATA rent (~0.002 SOL x ${sim.totals.eligible}): ~${roundSol(0.00204 * sim.totals.eligible)} SOL`,
      `- Moderator lock tx + fees + buffer: ~0.3 SOL`,
      '',
      '## DBD Treasury',
      '- No SOL required unless technically needed.',
      '',
      '## DBD Dev Privat',
      '- NOT INCLUDED. Personal post-launch market buys, Philippe\'s own funds and decision.',
      `- Ground truth for the SOL figure is the live pump.fun create-screen quote.`,
      ''].join('\n'));

  writeFileSync(resolve(OUT, 'MEMBER-DISTRIBUTION-PLAN.md'),
    `# [SIMULATION] Member Distribution Plan\n${BANNER}\n- Recipients: ${sim.distribution.totalRecipients}\n- Tokens: ${sim.distribution.totalTokens.toLocaleString('en-US')} DBD (10,000 each)\n- Batches (8/tx): ${sim.distribution.batches.length}\n- Mode: dry-run, nothing sent.\n`);

  writeFileSync(resolve(OUT, 'MODERATOR-LOCK-PLAN.md'),
    `# [SIMULATION] Moderator Lock Plan\n${BANNER}\n- Moderators ok: ${sim.modCheck.ok}\n- Window: ${sim.modCheck.window.lock_start} -> ${sim.modCheck.window.lock_end} (${sim.modCheck.window.days} days)\n${sim.modCheck.blockers.length ? '- Blockers: ' + sim.modCheck.blockers.join('; ') : '- No blockers'}\n`);

  writeFileSync(resolve(OUT, 'LAUNCH-RECONCILIATION.md'),
    `# [SIMULATION] Launch Reconciliation\n${BANNER}\n- Status: PRE-LAUNCH\n- Obligation total: ${sim.rec.obligations.total.toLocaleString('en-US')} DBD\n- Distributed: 0\n- Locked: 0\n- Reconciled after launch target: members delta ${sim.rec.deltas.members.toLocaleString('en-US')}, mods delta ${sim.rec.deltas.moderators.toLocaleString('en-US')}\n`);

  // Re-assert production config is still pre-launch after the run.
  const after = loadConfig();
  const stillPrelaunch = after.launch_status === 'prelaunch' && after.official_mint === MINT_NOT_ISSUED;

  console.log('DBD FULL LAUNCH SIMULATION (no token created, nothing sent)');
  console.log('='.repeat(58));
  console.log(`  Sample eligible members  ${sim.totals.eligible}`);
  console.log(`  Obligation total         ${sim.obligations.total.toLocaleString('en-US')} DBD (${sim.obligations.percentOfSupply.toFixed(4)}%)`);
  console.log(`  Est. create+buy SOL      ${roundSol(sim.quote.totalSol)} (buffer ${roundSol(sim.quote.withBuffer)})`);
  console.log(`  Distribution batches     ${sim.distribution.batches.length}`);
  console.log(`  Moderator locks ready    ${sim.modCheck.ok}`);
  console.log(`  Production config safe   ${stillPrelaunch ? 'YES (prelaunch / NOT_YET_ISSUED)' : 'NO'}`);
  console.log(`\n  Artifacts written to launch/generated/simulation/`);
  process.exit(stillPrelaunch ? 0 : 1);
}

if (process.argv[1]?.endsWith('simulate-launch.js')) {
  main();
}

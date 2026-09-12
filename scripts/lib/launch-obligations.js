// LOCKED DBD launch economics. These constants are the FINAL agreement and are
// the single source of truth for every launch calculation, tool and test.
// DO NOT change these numbers without an explicit new human decision.
//
// Pure module: no network, no filesystem, no secrets.

export const TOTAL_SUPPLY = 1_000_000_000; // 1B DBD, fixed by pump.fun

// Founder / moderator allocations, in whole DBD.
export const FOUNDER_TOKENS = 10_000_000; // 1%
export const MODERATOR_TOKENS_EACH = 25_000_000; // 2.5% each
export const MEMBER_REWARD_TOKENS = 10_000; // per eligible member

// The two moderators, by role. Wallets are filled in launch/moderators.json,
// never invented here.
export const MODERATORS = Object.freeze([
  Object.freeze({ name: 'Zafir', telegram: '@zafironchain', tokens: MODERATOR_TOKENS_EACH }),
  Object.freeze({ name: 'Emmanuel Crypt', telegram: '', tokens: MODERATOR_TOKENS_EACH }),
]);

// Timing (UTC). 14:00 CEST = 12:00 UTC ; 20:00 CEST = 18:00 UTC.
export const MEMBER_DEADLINE_UTC = '2026-09-15T12:00:00Z';
export const LAUNCH_UTC = '2026-09-15T18:00:00Z';

// Moderator anti-dump protection window.
export const MODERATOR_LOCK_DAYS = 7;

export function pctOfSupply(tokens) {
  return (tokens / TOTAL_SUPPLY) * 100;
}

// Compute the FULL launch obligation for a given number of eligible members.
// DBD Dev Privat (Philippe's later personal market buys) is deliberately NOT
// part of this and must never be added here.
export function computeObligations(eligibleMemberCount) {
  const n = Number(eligibleMemberCount);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`eligibleMemberCount must be a non-negative integer, got: ${eligibleMemberCount}`);
  }
  const founder = FOUNDER_TOKENS;
  const zafir = MODERATOR_TOKENS_EACH;
  const emmanuel = MODERATOR_TOKENS_EACH;
  const moderators = zafir + emmanuel;
  const members = n * MEMBER_REWARD_TOKENS;
  const total = founder + moderators + members;
  return {
    eligibleMemberCount: n,
    founder,
    moderators: { zafir, emmanuel, total: moderators },
    members,
    total,
    percentOfSupply: pctOfSupply(total),
    breakdownPercent: {
      founder: pctOfSupply(founder),
      moderatorsEach: pctOfSupply(MODERATOR_TOKENS_EACH),
      moderatorsTotal: pctOfSupply(moderators),
      members: pctOfSupply(members),
    },
    // Explicitly excluded from the mandatory launch obligation:
    excluded: ['DBD Dev Privat (personal post-launch market buys)'],
  };
}

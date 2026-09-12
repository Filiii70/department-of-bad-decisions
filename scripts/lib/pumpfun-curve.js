// Pump.fun bonding-curve quote math. CALCULATION ONLY. Never signs, never buys,
// never touches a wallet or the network.
//
// VERIFIED (see docs/PUMPFUN-LIVE-VERIFICATION-2026-09-15.md):
//  - constant-product AMM (x*y=k) with two virtual reserves
//  - total supply 1,000,000,000
//  - bonding-curve trade fee 1.25% total (creator 0.300% + protocol 0.950%)
//  - creation costs 0 SOL
//
// NOT officially published by pump.fun: the exact initial virtual reserves.
// The values below are the widely-used on-chain/community constants and MUST be
// re-checked against the LIVE quote on the pump.fun create screen before signing.
// The project's own earlier real quote (~0.35 SOL for ~1%) is consistent here.

export const CURVE_PARAMS = Object.freeze({
  totalSupply: 1_000_000_000,
  virtualSol: 30, // community/on-chain constant, NOT officially published
  virtualTokens: 1_073_000_000, // community/on-chain constant, NOT officially published
  tradeFeeRate: 0.0125, // verified 1.25%
  source:
    'pump.fun/docs/bonding-curve + /docs/fees (constant-product, 1.25% fee); virtual reserves = community constants, re-verify on the live create screen',
  paramsAsOf: '2026-09-15',
});

// SOL required to buy `tokens` starting from the initial curve state.
// Returns { ok, rawSol, feeSol, totalSol, withBuffer, overCurve } or ok:false.
export function quoteBuy(tokens, { params = CURVE_PARAMS, bufferPct = 15 } = {}) {
  const t = Number(tokens);
  if (!Number.isFinite(t) || t <= 0) {
    return { ok: false, error: 'tokens must be a positive number' };
  }
  const realTradable = params.virtualTokens; // upper bound on the virtual reserve
  const newTokenReserve = params.virtualTokens - t;
  if (newTokenReserve <= 0) {
    return { ok: false, error: 'amount too large for the curve (reserve would go non-positive)' };
  }
  const k = params.virtualSol * params.virtualTokens;
  const rawSol = k / newTokenReserve - params.virtualSol;
  const feeSol = rawSol * params.tradeFeeRate;
  const totalSol = rawSol + feeSol;
  const withBuffer = totalSol * (1 + bufferPct / 100);
  return {
    ok: true,
    tokens: t,
    percentOfSupply: (t / params.totalSupply) * 100,
    rawSol,
    feeSol,
    totalSol,
    bufferPct,
    withBuffer,
    overCurve: t > realTradable,
    paramsSource: params.source,
    paramsAsOf: params.paramsAsOf,
  };
}

export function roundSol(x, dp = 6) {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

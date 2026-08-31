// Read-only Solana helpers: base58 address validation and JSON-RPC calls.
// No signing, no private keys. Uses the public RPC by default via env config.
//
// Everything here fails safe: on any network error the caller receives a
// structured result with `ok: false` and a reason, never a fabricated value.

const BASE58_ALPHABET = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = (() => {
  const m = new Map();
  for (let i = 0; i < BASE58_ALPHABET.length; i++) m.set(BASE58_ALPHABET[i], i);
  return m;
})();

// Decode base58 to a byte array. Returns null on any invalid character.
export function base58Decode(str) {
  if (typeof str !== 'string' || str.length === 0) return null;
  const bytes = [0];
  for (const ch of str) {
    const val = BASE58_MAP.get(ch);
    if (val === undefined) return null;
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Account for leading zeros (encoded as '1').
  for (let k = 0; k < str.length && str[k] === '1'; k++) bytes.push(0);
  return bytes.reverse();
}

// A valid Solana address is a base58 string decoding to exactly 32 bytes.
export function isValidSolanaAddress(address) {
  if (typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  const decoded = base58Decode(address);
  return Array.isArray(decoded) && decoded.length === 32;
}

export function getRpcUrl() {
  return process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
}

// Minimal JSON-RPC client. Returns { ok, result } or { ok:false, error }.
export async function rpc(method, params = [], { rpcUrl = getRpcUrl(), timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = await res.json();
    if (json.error) return { ok: false, error: json.error.message || 'RPC error' };
    return { ok: true, result: json.result };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : String(err.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

// SOL balance in whole SOL, or null when unavailable.
export async function getSolBalance(address, opts = {}) {
  if (!isValidSolanaAddress(address)) return { ok: false, error: 'invalid address' };
  const r = await rpc('getBalance', [address], opts);
  if (!r.ok) return r;
  const lamports = r.result?.value ?? 0;
  return { ok: true, sol: lamports / LAMPORTS_PER_SOL, lamports };
}

// Token supply (uiAmount) for a mint, or unavailable.
export async function getTokenSupply(mint, opts = {}) {
  if (!isValidSolanaAddress(mint)) return { ok: false, error: 'invalid mint' };
  const r = await rpc('getTokenSupply', [mint], opts);
  if (!r.ok) return r;
  const v = r.result?.value;
  if (!v) return { ok: false, error: 'no supply data' };
  return {
    ok: true,
    amount: v.amount,
    decimals: v.decimals,
    uiAmount: v.uiAmount,
    uiAmountString: v.uiAmountString,
  };
}

// Account info for a mint (proves it exists on chain).
export async function getMintAccount(mint, opts = {}) {
  if (!isValidSolanaAddress(mint)) return { ok: false, error: 'invalid mint' };
  const r = await rpc('getAccountInfo', [mint, { encoding: 'jsonParsed' }], opts);
  if (!r.ok) return r;
  const value = r.result?.value;
  if (!value) return { ok: false, error: 'mint account not found' };
  const parsed = value.data?.parsed;
  return {
    ok: true,
    owner: value.owner,
    exists: true,
    parsed: parsed?.info ?? null,
    type: parsed?.type ?? null,
  };
}

// Largest token accounts (top holders) for a mint. Public RPC returns up to 20.
export async function getTokenLargestAccounts(mint, opts = {}) {
  if (!isValidSolanaAddress(mint)) return { ok: false, error: 'invalid mint' };
  const r = await rpc('getTokenLargestAccounts', [mint], opts);
  if (!r.ok) return r;
  const v = r.result?.value;
  if (!Array.isArray(v)) return { ok: false, error: 'no holder data' };
  return { ok: true, accounts: v };
}

// SPL token balance a wallet holds for a given mint (sum across its token accounts).
export async function getTokenBalanceForOwner(owner, mint, opts = {}) {
  if (!isValidSolanaAddress(owner)) return { ok: false, error: 'invalid owner' };
  if (!isValidSolanaAddress(mint)) return { ok: false, error: 'invalid mint' };
  const r = await rpc('getTokenAccountsByOwner', [owner, { mint }, { encoding: 'jsonParsed' }], opts);
  if (!r.ok) return r;
  const accounts = r.result?.value ?? [];
  let uiAmount = 0;
  for (const acc of accounts) {
    const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    uiAmount += amt;
  }
  return { ok: true, uiAmount, accounts: accounts.length };
}

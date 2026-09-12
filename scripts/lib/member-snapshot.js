// Member snapshot validation. Pure logic: given raw pre-launch submissions,
// decide who is eligible and compute the exact member-token total.
// No network, no signing, no invented records.

import { isValidSolanaAddress } from './solana.js';
import { MEMBER_REWARD_TOKENS, MEMBER_DEADLINE_UTC, TOTAL_SUPPLY } from './launch-obligations.js';

// Minimal CSV parser. Handles a header row, comma separation and simple double
// quoting. Blank lines and lines starting with '#' are ignored.
export function parseCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
  if (lines.length === 0) return { header: [], rows: [] };
  const header = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const obj = {};
    header.forEach((h, i) => {
      obj[h.trim()] = (cells[i] ?? '').trim();
    });
    return obj;
  });
  return { header, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function submittedBeforeDeadline(submittedAt, deadlineUtc) {
  if (!submittedAt) return false;
  const t = new Date(submittedAt).getTime();
  const d = new Date(deadlineUtc).getTime();
  if (Number.isNaN(t) || Number.isNaN(d)) return false;
  return t <= d;
}

// Validate raw submissions. Each submission: { telegram_username, wallet, submitted_at }.
// Returns { rows, totals }. First valid occurrence of a wallet/username wins;
// later duplicates are flagged and made ineligible.
export function validateSubmissions(submissions, { deadlineUtc = MEMBER_DEADLINE_UTC } = {}) {
  const seenWallet = new Map();
  const seenUser = new Map();

  const rows = submissions.map((s) => {
    const telegram_username = (s.telegram_username ?? '').trim();
    const wallet = (s.wallet ?? '').trim();
    const submitted_at = (s.submitted_at ?? '').trim();

    const wallet_valid = isValidSolanaAddress(wallet);
    const submitted_before_deadline = submittedBeforeDeadline(submitted_at, deadlineUtc);

    const walletKey = wallet.toLowerCase();
    const userKey = telegram_username.toLowerCase();
    const duplicate_wallet = wallet.length > 0 && seenWallet.has(walletKey);
    const duplicate_username = telegram_username.length > 0 && seenUser.has(userKey);

    const eligible =
      wallet_valid &&
      submitted_before_deadline &&
      !duplicate_wallet &&
      !duplicate_username &&
      telegram_username.length > 0;

    // Record first occurrence only if the row is otherwise usable, so a later
    // valid row is not blocked by an earlier invalid one with the same key.
    if (wallet.length > 0 && !seenWallet.has(walletKey)) seenWallet.set(walletKey, true);
    if (telegram_username.length > 0 && !seenUser.has(userKey)) seenUser.set(userKey, true);

    return {
      telegram_username,
      wallet,
      submitted_at,
      submitted_before_deadline,
      wallet_valid,
      duplicate_username,
      duplicate_wallet,
      eligible,
      reward_tokens: eligible ? MEMBER_REWARD_TOKENS : 0,
      distribution_status: 'PENDING',
      tx_signature: '',
      notes: buildNotes({ wallet, wallet_valid, submitted_before_deadline, duplicate_wallet, duplicate_username, telegram_username }),
    };
  });

  const totals = summarize(rows);
  return { rows, totals };
}

function buildNotes({ wallet, wallet_valid, submitted_before_deadline, duplicate_wallet, duplicate_username, telegram_username }) {
  const n = [];
  if (!telegram_username) n.push('missing telegram_username');
  if (!wallet) n.push('missing wallet');
  else if (!wallet_valid) n.push('invalid Solana wallet');
  if (!submitted_before_deadline) n.push('submitted after deadline');
  if (duplicate_wallet) n.push('duplicate wallet');
  if (duplicate_username) n.push('duplicate username');
  return n.join('; ');
}

export function summarize(rows) {
  const submissions = rows.length;
  const valid_wallets = rows.filter((r) => r.wallet_valid).length;
  const invalid_wallets = submissions - valid_wallets;
  const duplicate_wallets = rows.filter((r) => r.duplicate_wallet).length;
  const duplicate_usernames = rows.filter((r) => r.duplicate_username).length;
  const eligible = rows.filter((r) => r.eligible).length;
  const member_tokens_total = eligible * MEMBER_REWARD_TOKENS;
  return {
    submissions,
    valid_wallets,
    invalid_wallets,
    duplicate_wallets,
    duplicate_usernames,
    eligible,
    member_tokens_total,
    percent_of_supply: (member_tokens_total / TOTAL_SUPPLY) * 100,
  };
}

export const SNAPSHOT_COLUMNS = [
  'telegram_username',
  'wallet',
  'submitted_before_deadline',
  'wallet_valid',
  'duplicate_username',
  'duplicate_wallet',
  'eligible',
  'reward_tokens',
  'distribution_status',
  'tx_signature',
  'notes',
];

export function rowsToSnapshotCsv(rows) {
  const header = SNAPSHOT_COLUMNS.join(',');
  const body = rows.map((r) =>
    SNAPSHOT_COLUMNS.map((c) => csvCell(r[c])).join(',')
  );
  return [header, ...body].join('\n') + '\n';
}

function csvCell(v) {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

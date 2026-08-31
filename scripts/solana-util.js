#!/usr/bin/env node
// Read-only Solana lookup CLI. No signing, no keys. Uses SOLANA_RPC_URL (env)
// or the public mainnet endpoint. Every failure prints a clear reason.
//
// Usage:
//   node scripts/solana-util.js balance <address>
//   node scripts/solana-util.js supply <mint>
//   node scripts/solana-util.js mint-info <mint>
//   node scripts/solana-util.js holders <mint>
//   node scripts/solana-util.js token-balance <owner> <mint>

import {
  getSolBalance, getTokenSupply, getMintAccount,
  getTokenLargestAccounts, getTokenBalanceForOwner, getRpcUrl, isValidSolanaAddress,
} from './lib/solana.js';

function usage() {
  console.log(`DBD Solana utility (read-only)
RPC: ${getRpcUrl()}

Commands:
  balance <address>              SOL balance for a wallet
  supply <mint>                  Token supply for a mint
  mint-info <mint>               Mint account info (proves existence)
  holders <mint>                 Top token accounts (up to 20)
  token-balance <owner> <mint>   Token balance a wallet holds for a mint
`);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') return usage();

  switch (cmd) {
    case 'balance': {
      if (!a) return fail('balance requires <address>');
      const r = await getSolBalance(a);
      if (!r.ok) return fail(r.error);
      console.log(`${a}\n  SOL balance: ${r.sol} (${r.lamports} lamports)`);
      break;
    }
    case 'supply': {
      if (!a) return fail('supply requires <mint>');
      const r = await getTokenSupply(a);
      if (!r.ok) return fail(r.error);
      console.log(`${a}\n  Supply: ${r.uiAmountString}\n  Decimals: ${r.decimals}\n  Raw: ${r.amount}`);
      break;
    }
    case 'mint-info': {
      if (!a) return fail('mint-info requires <mint>');
      const r = await getMintAccount(a);
      if (!r.ok) return fail(r.error);
      console.log(`${a}\n  Owner program: ${r.owner}\n  Type: ${r.type}`);
      if (r.parsed) console.log('  Info: ' + JSON.stringify(r.parsed));
      break;
    }
    case 'holders': {
      if (!a) return fail('holders requires <mint>');
      const r = await getTokenLargestAccounts(a);
      if (!r.ok) return fail(r.error);
      console.log(`Top ${r.accounts.length} token accounts for ${a}:`);
      r.accounts.forEach((acc, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${acc.address}  ${acc.uiAmountString}`);
      });
      break;
    }
    case 'token-balance': {
      if (!a || !b) return fail('token-balance requires <owner> <mint>');
      const r = await getTokenBalanceForOwner(a, b);
      if (!r.ok) return fail(r.error);
      console.log(`Owner ${a}\n  Holds: ${r.uiAmount} of mint ${b} across ${r.accounts} account(s)`);
      break;
    }
    default:
      usage();
      process.exit(1);
  }
}

function fail(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

main().catch((e) => fail(e.message));

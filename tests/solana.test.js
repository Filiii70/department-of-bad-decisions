import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSolanaAddress, base58Decode } from '../scripts/lib/solana.js';

test('valid Solana addresses decode to 32 bytes', () => {
  // Well-known valid mainnet addresses (public, read-only references).
  assert.equal(isValidSolanaAddress('So11111111111111111111111111111111111111112'), true); // wrapped SOL
  assert.equal(isValidSolanaAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), true); // SPL Token program
});

test('invalid addresses are rejected', () => {
  assert.equal(isValidSolanaAddress('NOT_YET_ISSUED'), false);
  assert.equal(isValidSolanaAddress(''), false);
  assert.equal(isValidSolanaAddress('0OIl_invalid_base58'), false); // 0, O, I, l not in alphabet
  assert.equal(isValidSolanaAddress('short'), false);
  assert.equal(isValidSolanaAddress('REPLACE_ME_CREATOR_WALLET'), false);
  assert.equal(isValidSolanaAddress(null), false);
});

test('base58Decode returns null on bad characters', () => {
  assert.equal(base58Decode('0'), null); // 0 is not in the base58 alphabet
  assert.equal(base58Decode('l'), null); // lowercase L excluded
});

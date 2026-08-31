// Deterministic URL generation for explorers and launch platforms.
// Pure functions, fully unit-testable. No network.

export function explorerTokenUrl(explorerBase, mint) {
  if (!explorerBase || !mint) return null;
  return `${explorerBase.replace(/\/$/, '')}/token/${mint}`;
}

export function explorerAccountUrl(explorerBase, address) {
  if (!explorerBase || !address) return null;
  return `${explorerBase.replace(/\/$/, '')}/account/${address}`;
}

// Known launch platforms map a mint to a public token page.
export function launchPlatformUrl(platform, mint) {
  if (!platform || !mint) return null;
  const p = String(platform).toLowerCase().trim();
  switch (p) {
    case 'pump.fun':
    case 'pumpfun':
      return `https://pump.fun/coin/${mint}`;
    case 'raydium':
      return `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}`;
    case 'jupiter':
      return `https://jup.ag/swap/SOL-${mint}`;
    case 'birdeye':
      return `https://birdeye.so/token/${mint}?chain=solana`;
    default:
      // Unknown platform: return null rather than guessing a wrong URL.
      return null;
  }
}

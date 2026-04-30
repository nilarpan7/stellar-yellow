// ─── Network Configuration ────────────────────────────────────────────────────
export const NETWORKS = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    explorerUrl: 'https://stellar.expert/explorer/testnet',
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

export const CURRENT_NETWORK: NetworkType = 'testnet';
export const NETWORK_CONFIG = NETWORKS[CURRENT_NETWORK];

// ─── Contract Address ─────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '';

// ─── Stellar / Soroban RPC Helpers ───────────────────────────────────────────
export function getSorobanRpcUrl(): string {
  return import.meta.env.VITE_SOROBAN_RPC_URL || NETWORK_CONFIG.rpcUrl;
}

export function getExplorerTxUrl(txHash: string): string {
  return `${NETWORK_CONFIG.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAccountUrl(address: string): string {
  return `${NETWORK_CONFIG.explorerUrl}/account/${address}`;
}

// ─── XLM Conversion Helpers ──────────────────────────────────────────────────
export const STROOPS_PER_XLM = 10_000_000n;

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

export function stroopsToXlm(stroops: bigint | number | string): number {
  return Number(BigInt(stroops)) / 10_000_000;
}

export function formatXlm(stroops: bigint | number | string, decimals = 2): string {
  const xlm = stroopsToXlm(stroops);
  return `${xlm.toFixed(decimals)} XLM`;
}

// ─── Address Helpers ──────────────────────────────────────────────────────────
export function truncateAddress(address: string, chars = 6): string {
  if (!address || address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ─── Time Helpers ─────────────────────────────────────────────────────────────
export function secondsToHours(seconds: number): number {
  return Math.round(seconds / 3600);
}

export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

export function formatCountdown(endTimeMs: number): {
  days: number; hours: number; minutes: number; seconds: number; expired: boolean;
} {
  const remaining = endTimeMs - Date.now();
  if (remaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

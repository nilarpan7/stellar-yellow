import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WalletState {
  address: string;
  walletId: string;
  walletName: string;
  isConnected: boolean;
}

// ─── Wallet Kit Initialization ────────────────────────────────────────────────
// StellarWalletsKit v2 is a static class — call init() once at startup.
let _initialized = false;

export function initWalletKit(): void {
  if (_initialized) return;
  _initialized = true;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: 'freighter',
    modules: [
      new FreighterModule(),
      new AlbedoModule(),
      new xBullModule(),
    ],
  });
}

// Returns the static StellarWalletsKit class (all methods are static in v2).
export function getWalletKit(): typeof StellarWalletsKit {
  initWalletKit();
  return StellarWalletsKit;
}

// ─── LocalStorage Key ─────────────────────────────────────────────────────────
const WALLET_STORAGE_KEY = 'stellarbid_wallet';

export function saveWalletToStorage(walletId: string): void {
  localStorage.setItem(WALLET_STORAGE_KEY, walletId);
}

export function loadWalletFromStorage(): string | null {
  return localStorage.getItem(WALLET_STORAGE_KEY);
}

export function clearWalletFromStorage(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

// ─── Supported Wallets Info ───────────────────────────────────────────────────
export const SUPPORTED_WALLETS = [
  { id: 'freighter', name: 'Freighter', icon: '🦊', description: 'Browser extension wallet' },
  { id: 'albedo', name: 'Albedo', icon: '🌐', description: 'Web-based, no install needed' },
  { id: 'xbull', name: 'xBull', icon: '🐂', description: 'Multi-platform wallet' },
] as const;

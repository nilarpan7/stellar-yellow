/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_NETWORK: string
  readonly VITE_SOROBAN_RPC_URL: string
  readonly VITE_HORIZON_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  Buffer: typeof import('buffer').Buffer;
  global: typeof globalThis;
}

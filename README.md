# StellarBid — Real-Time Auction dApp

A decentralized, real-time auction platform built on Stellar Soroban Testnet. Part of the Yellow Belt (Level 2) project.

## Features

- **Multi-Wallet Integration**: Supports Freighter, Albedo, and xBull using `@creit.tech/stellar-wallets-kit`.
- **Smart Contract**: Soroban contract for creating auctions, placing bids, and settling.
- **Real-Time Events**: Live event feed and toast notifications for new bids on the watched auction.
- **Transaction Status**: Comprehensive UI for pending, success, and failure states of transactions.
- **Error Handling**: Graceful parsing of 6+ error scenarios (user rejected, wallet not found, bid too low, etc.).

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Ensure the `VITE_CONTRACT_ADDRESS` is set to the deployed Soroban contract address on the Stellar Testnet.

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Architecture

- **Frontend**: Vite + React + TypeScript + TailwindCSS
- **Smart Contract**: Soroban (Rust)
- **Network**: Stellar Testnet
- **SDK**: `@stellar/stellar-sdk`

## Smart Contract

The deployed smart contract address on Stellar Testnet is:
`CA4RTVJ4RETLRL5DM4GMZWF4VUKOVSRKYHBKR5KL76MNEIU7QN4BK52V`

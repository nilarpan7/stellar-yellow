# Requirements Document

## Introduction

This document specifies the remaining features and fixes needed to make the StellarBid auction dApp fully functional and production-ready for Stellar Testnet. The application is a decentralized auction platform built with React/TypeScript/Vite frontend and Soroban smart contracts. Core functionality (wallet integration, contract calls, auction creation, bidding) is already implemented and working. This spec addresses missing UI features, configuration gaps, and production readiness concerns.

## Glossary

- **StellarBid_App**: The React/TypeScript/Vite frontend application
- **Mobile_Menu**: A collapsible navigation menu for small screens (hamburger menu)
- **Share_Button**: A UI control that enables users to share auction links
- **Hero_Connect_Link**: The "Connect Wallet" link in the home page hero section
- **MyAuctions_Page**: The page displaying user's created auctions, active bids, and won auctions
- **Demo_Mode_Indicator**: A visual indicator showing the app is using demo data instead of live contract data
- **Wallet_Reconnection**: The process of automatically restoring wallet connection on page load
- **Loading_Indicator**: A visual feedback element shown during wallet reconnection
- **Fallback_Route**: A catch-all route that handles undefined paths (404 page)
- **Buffer_Polyfill**: A Node.js Buffer implementation required for Stellar SDK in browser environments
- **Contract_Verification**: The process of confirming the Soroban contract matches frontend expectations
- **Environment_Configuration**: The .env file containing contract address and network settings

## Requirements

### Requirement 1: Mobile Navigation

**User Story:** As a mobile user, I want to access navigation links on small screens, so that I can browse all pages of the application.

#### Acceptance Criteria

1. WHEN the viewport width is below 640px, THE Mobile_Menu SHALL display a hamburger icon button
2. WHEN the hamburger icon is clicked, THE Mobile_Menu SHALL expand to show all navigation links
3. WHEN a navigation link is clicked, THE Mobile_Menu SHALL collapse automatically
4. WHEN the Mobile_Menu is open and the user clicks outside, THE Mobile_Menu SHALL collapse
5. THE Mobile_Menu SHALL display the same navigation items as the desktop navbar (Auctions, Create, My Bids)
6. WHILE the Mobile_Menu is open, THE StellarBid_App SHALL prevent body scroll

### Requirement 2: Share Auction Functionality

**User Story:** As a user viewing an auction, I want to share the auction link, so that I can invite others to bid.

#### Acceptance Criteria

1. WHEN the Share_Button is clicked, THE StellarBid_App SHALL copy the auction URL to the clipboard
2. WHEN the URL is copied successfully, THE StellarBid_App SHALL display a success toast notification
3. IF the clipboard API is not available, THEN THE StellarBid_App SHALL display a fallback modal with the URL for manual copying
4. THE Share_Button SHALL display a visual feedback animation when clicked
5. THE copied URL SHALL be the full absolute URL including protocol and domain

### Requirement 3: Hero Connect Wallet Link

**User Story:** As a disconnected user on the home page, I want the hero "Connect Wallet" link to open the wallet modal, so that I can connect my wallet without searching for the button.

#### Acceptance Criteria

1. WHEN the Hero_Connect_Link is clicked, THE StellarBid_App SHALL open the wallet connection modal
2. WHEN the wallet connection succeeds, THE Hero_Connect_Link SHALL disappear from the hero section
3. THE Hero_Connect_Link SHALL only be visible when the user is not connected
4. WHEN the Hero_Connect_Link is clicked, THE StellarBid_App SHALL prevent default anchor navigation behavior

### Requirement 4: MyAuctions Demo Data Fallback

**User Story:** As a user exploring the app without a deployed contract, I want to see demo data on the MyAuctions page, so that I can understand the page layout and functionality.

#### Acceptance Criteria

1. WHEN the contract returns zero auctions and the user is connected, THE MyAuctions_Page SHALL display demo auction data
2. THE demo auction data SHALL include at least one auction in each category (created, bidding, won)
3. THE demo auction data SHALL use the connected wallet address as the creator or bidder
4. WHEN real contract data is available, THE MyAuctions_Page SHALL display real data instead of demo data
5. THE demo auction data SHALL be visually consistent with the Home page demo data

### Requirement 5: Environment Configuration File

**User Story:** As a developer deploying the app, I want a .env file with the contract address, so that the app connects to the live contract.

#### Acceptance Criteria

1. THE Environment_Configuration SHALL exist as a .env file in the project root
2. THE Environment_Configuration SHALL contain VITE_CONTRACT_ADDRESS with a valid Stellar contract address
3. THE Environment_Configuration SHALL contain VITE_NETWORK set to "testnet"
4. THE Environment_Configuration SHALL contain VITE_SOROBAN_RPC_URL with the Stellar testnet RPC endpoint
5. THE Environment_Configuration SHALL contain VITE_HORIZON_URL with the Stellar testnet Horizon endpoint
6. WHEN VITE_CONTRACT_ADDRESS is empty or missing, THE StellarBid_App SHALL fall back to demo data

### Requirement 6: Demo Mode Indicator

**User Story:** As a user, I want to know when the app is using demo data, so that I understand my actions won't affect real blockchain state.

#### Acceptance Criteria

1. WHEN VITE_CONTRACT_ADDRESS is empty or missing, THE Demo_Mode_Indicator SHALL be visible on all pages
2. THE Demo_Mode_Indicator SHALL display a clear message that the app is in demo mode
3. THE Demo_Mode_Indicator SHALL be positioned prominently (top banner or persistent notification)
4. THE Demo_Mode_Indicator SHALL include a visual distinction (color, icon) from normal UI elements
5. WHEN VITE_CONTRACT_ADDRESS is configured, THE Demo_Mode_Indicator SHALL not be visible

### Requirement 7: Wallet Reconnection Loading State

**User Story:** As a returning user, I want to see feedback during wallet reconnection, so that I know the app is attempting to restore my session.

#### Acceptance Criteria

1. WHEN the StellarBid_App loads and a previous wallet connection exists, THE Loading_Indicator SHALL be visible
2. THE Loading_Indicator SHALL display a message indicating wallet reconnection is in progress
3. WHEN wallet reconnection succeeds, THE Loading_Indicator SHALL disappear
4. WHEN wallet reconnection fails, THE Loading_Indicator SHALL disappear without displaying an error
5. THE Loading_Indicator SHALL not block user interaction with the rest of the page

### Requirement 8: Buffer Polyfill Verification

**User Story:** As a developer, I want to verify the Buffer polyfill is correctly configured, so that Stellar SDK functions work in the browser.

#### Acceptance Criteria

1. THE StellarBid_App SHALL include the buffer package in dependencies
2. THE vite.config.ts SHALL define global as globalThis
3. THE vite.config.ts SHALL alias buffer to the buffer package
4. THE vite.config.ts SHALL configure esbuildOptions to define global as globalThis
5. WHEN the StellarBid_App runs in the browser, THE Stellar SDK SHALL not throw Buffer-related errors

### Requirement 9: 404 Fallback Route

**User Story:** As a user navigating to an invalid URL, I want to see a helpful 404 page, so that I can return to valid pages.

#### Acceptance Criteria

1. WHEN a user navigates to an undefined route, THE Fallback_Route SHALL render a 404 page
2. THE 404 page SHALL display a clear message that the page was not found
3. THE 404 page SHALL include a link to return to the home page
4. THE 404 page SHALL include a link to view all auctions
5. THE 404 page SHALL maintain the navbar and overall app layout

### Requirement 10: Contract Verification

**User Story:** As a developer, I want to verify the Soroban contract matches frontend expectations, so that contract calls succeed.

#### Acceptance Criteria

1. THE Soroban contract SHALL implement the create_auction function with parameters (creator: Address, item_name: String, description: String, starting_price: i128, duration_secs: u64)
2. THE Soroban contract SHALL implement the place_bid function with parameters (auction_id: u64, bidder: Address, amount: i128)
3. THE Soroban contract SHALL implement the end_auction function with parameter (auction_id: u64)
4. THE Soroban contract SHALL implement the get_auction function with parameter (auction_id: u64) returning Auction struct
5. THE Soroban contract SHALL implement the get_auction_count function returning u64
6. THE Soroban contract SHALL emit a bid_plcd event when a bid is placed
7. THE Auction struct SHALL contain fields: id, creator, item_name, description, starting_price, highest_bid, highest_bidder, end_time, status
8. THE AuctionStatus enum SHALL have variants Active and Ended
9. FOR ALL contract functions, parsing the returned ScVal SHALL produce the expected TypeScript types in the frontend

### Requirement 11: Production Readiness Checklist

**User Story:** As a developer preparing for deployment, I want a checklist of production readiness items, so that I can ensure the app is fully functional.

#### Acceptance Criteria

1. THE StellarBid_App SHALL have all navigation features working on mobile and desktop
2. THE StellarBid_App SHALL have all interactive buttons (share, connect wallet) functioning
3. THE StellarBid_App SHALL display appropriate feedback for demo mode vs live mode
4. THE StellarBid_App SHALL handle wallet reconnection gracefully with loading states
5. THE StellarBid_App SHALL handle invalid routes with a 404 page
6. THE StellarBid_App SHALL have the contract address configured in .env
7. THE StellarBid_App SHALL successfully call all contract functions when deployed
8. THE StellarBid_App SHALL display real-time bid events when polling is active
9. THE StellarBid_App SHALL build without errors using `npm run build`
10. THE StellarBid_App SHALL pass linting using `npm run lint`

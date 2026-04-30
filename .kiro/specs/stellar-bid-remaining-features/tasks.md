# Implementation Plan: StellarBid Remaining Features

## Overview

This implementation plan addresses 11 remaining features needed for production readiness of the StellarBid auction dApp. The app is already functional with core features (wallet integration, contract calls, auction creation, bidding) working. This plan follows the implementation order specified in the design document, starting with foundational configuration and moving through UI enhancements to final validation.

## Tasks

- [ ] 1. Create environment configuration file
  - Create `.env` file in project root by copying from `.env.example`
  - Leave `VITE_CONTRACT_ADDRESS` empty by default to enable demo mode
  - Include all testnet configuration variables
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 2. Implement demo mode indicator banner
  - [ ] 2.1 Create DemoBanner component
    - Create `src/components/DemoBanner.tsx`
    - Check `import.meta.env.VITE_CONTRACT_ADDRESS` to determine visibility
    - Render amber/yellow banner with warning icon when contract address is empty
    - Include clear message: "Demo Mode: No contract deployed. All data is simulated."
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ] 2.2 Integrate DemoBanner into App layout
    - Import DemoBanner in `src/App.tsx`
    - Add DemoBanner above Navbar component
    - Ensure banner is visible on all pages
    - _Requirements: 6.3, 6.5_

- [ ] 3. Verify Buffer polyfill configuration
  - Read `vite.config.ts` and document verification
  - Confirm `define: { global: 'globalThis' }` exists
  - Confirm `resolve.alias: { buffer: 'buffer' }` exists
  - Confirm `optimizeDeps.esbuildOptions.define: { global: 'globalThis' }` exists
  - Document that configuration is already correct (no changes needed)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Verify Soroban contract matches frontend expectations
  - Read `contracts/auction/src/lib.rs`
  - Verify `create_auction` function signature matches TypeScript expectations
  - Verify `place_bid` function signature matches TypeScript expectations
  - Verify `end_auction` function signature matches TypeScript expectations
  - Verify `get_auction` function signature matches TypeScript expectations
  - Verify `get_auction_count` function signature matches TypeScript expectations
  - Verify `Auction` struct fields match `AuctionData` interface
  - Verify `AuctionStatus` enum variants match TypeScript expectations
  - Verify `bid_plcd` event is emitted in `place_bid`
  - Document verification results (no code changes expected)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [ ] 5. Implement mobile navigation menu
  - [ ] 5.1 Add mobile menu state and hamburger button
    - Add `useState<boolean>` for `isMobileMenuOpen` in `src/components/Navbar.tsx`
    - Import `Menu` and `X` icons from lucide-react
    - Add hamburger button visible only on mobile (`sm:hidden`)
    - _Requirements: 1.1, 1.2_
  
  - [ ] 5.2 Implement mobile menu overlay
    - Create fixed full-screen overlay with backdrop
    - Render navigation links in mobile menu
    - Add close button (X icon) in mobile menu header
    - Style mobile menu to match app theme (dark background, purple accents)
    - _Requirements: 1.5_
  
  - [ ] 5.3 Add mobile menu interaction handlers
    - Close menu on navigation link click
    - Close menu on backdrop click
    - Close menu on ESC key press
    - Lock body scroll when menu is open using `useEffect`
    - Unlock body scroll when menu closes
    - _Requirements: 1.3, 1.4, 1.6_

- [ ] 6. Fix hero connect wallet link
  - Open `src/pages/Home.tsx`
  - Replace `<Link to="/#connect">` with `<button onClick={() => connect()}>`
  - Keep same styling (`btn-secondary text-base px-6 py-3`)
  - Ensure button only renders when `!isConnected`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement share auction functionality
  - [ ] 7.1 Add share button handler
    - Create `handleShare` function in `src/pages/AuctionDetail.tsx`
    - Use `navigator.clipboard.writeText(window.location.href)` to copy URL
    - Show success toast on successful copy
    - Add error handling for clipboard API failures
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 7.2 Add fallback modal for manual copy
    - Create state for `showShareModal`
    - Render modal with readonly input containing URL when clipboard unavailable
    - Add close button for modal
    - Style modal to match app theme
    - _Requirements: 2.3_
  
  - [ ] 7.3 Connect share button to handler
    - Replace no-op Share button with `onClick={handleShare}`
    - Add visual feedback animation on button click
    - _Requirements: 2.4_

- [ ] 8. Add demo data fallback to MyAuctions page
  - [ ] 8.1 Create demo data generator function
    - Create `getDemoAuctionsForUser(address: string)` function in `src/pages/MyAuctions.tsx`
    - Generate 3 demo auctions: one created by user, one where user is highest bidder (active), one where user won (ended)
    - Use connected wallet address as creator or bidder
    - _Requirements: 4.2, 4.3_
  
  - [ ] 8.2 Integrate demo data into MyAuctions logic
    - Check if `count === 0` and user is connected
    - Call `getDemoAuctionsForUser(wallet!.address)` to populate demo data
    - Ensure demo data appears in all three tabs (created, bidding, won)
    - Ensure real data takes precedence when available
    - _Requirements: 4.1, 4.4, 4.5_

- [ ] 9. Add wallet reconnection loading state
  - [ ] 9.1 Add isReconnecting state to useWallet hook
    - Add `isReconnecting` state in `src/hooks/useWallet.ts`
    - Set to `true` at start of `reconnect()` function
    - Set to `false` when reconnect completes (success or failure)
    - Export `isReconnecting` in return value
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 9.2 Display reconnecting indicator in WalletConnect
    - Import `isReconnecting` from useWallet in `src/components/WalletConnect.tsx`
    - Show "Reconnecting…" message with spinner when `isReconnecting` is true
    - Position indicator subtly (not blocking other UI)
    - Hide indicator when reconnection completes
    - _Requirements: 7.4, 7.5_

- [ ] 10. Create 404 fallback route
  - [ ] 10.1 Create NotFound page component
    - Create `src/pages/NotFound.tsx`
    - Display large "404" heading with styled text
    - Include "Page Not Found" message
    - Add helpful description text
    - Include links to home page and auctions
    - Style to match app theme (dark background, purple accents, slate text)
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [ ] 10.2 Add catch-all route to App
    - Import NotFound component in `src/App.tsx`
    - Add `<Route path="*" element={<NotFound />} />` as last route
    - Ensure NotFound maintains navbar layout
    - _Requirements: 9.1, 9.5_

- [ ] 11. Checkpoint - Validate all features are working
  - Test mobile navigation on viewport < 640px
  - Test share button with clipboard and fallback
  - Test hero connect wallet button opens modal
  - Test MyAuctions shows demo data when contract address empty
  - Test demo banner appears when contract address empty
  - Test wallet reconnection shows loading state
  - Test 404 page renders for invalid routes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Production build validation
  - Run `npm run build` and verify no errors
  - Run `npm run lint` and verify no errors
  - Document any warnings that need addressing
  - Test built app loads in browser without console errors
  - _Requirements: 11.9, 11.10_

## Notes

- All tasks reference specific requirements for traceability
- Implementation follows the order specified in design document
- Buffer polyfill and contract verification are documentation tasks only (no code changes)
- Checkpoint ensures incremental validation before final build
- Mobile navigation requires careful testing on real devices
- Share functionality needs cross-browser clipboard API testing
- Demo mode features depend on environment configuration being completed first

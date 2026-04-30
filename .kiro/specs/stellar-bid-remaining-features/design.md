# Design Document

## Overview

This document outlines the technical design for completing the StellarBid auction dApp. The application is already functional with core features (wallet integration, contract calls, auction creation/bidding) working. This design addresses 11 remaining items needed for production readiness: mobile navigation, share functionality, hero link fix, demo data fallbacks, environment configuration, demo mode indicator, wallet reconnection feedback, Buffer polyfill verification, 404 page, contract verification, and build validation.

## High-Level Architecture

The StellarBid dApp follows a standard React SPA architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React App (src/App.tsx)                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ DemoBanner   │  │   Navbar     │  │ WalletConnect│ │ │
│  │  │ (new)        │  │ (+ mobile)   │  │ (+ reconnect)│ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  React Router                                     │ │ │
│  │  │  - Home (+ hero fix)                              │ │ │
│  │  │  - CreateAuction                                  │ │ │
│  │  │  - AuctionDetail (+ share)                        │ │ │
│  │  │  - MyAuctions (+ demo data)                       │ │ │
│  │  │  - NotFound (new)                                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                                                  │
│           ├─ useWallet (+ isReconnecting)                   │
│           ├─ useContract                                     │
│           └─ useAuctionEvents                                │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Stellar Testnet (Soroban RPC + Horizon)                    │
│  - Contract: create_auction, place_bid, end_auction         │
│  - Events: bid_plcd                                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Mobile Navigation (Navbar.tsx)

**Approach:**
- Add `useState<boolean>` for `isMobileMenuOpen`
- Render hamburger icon (Menu from lucide-react) on mobile (`sm:hidden`)
- Render mobile menu overlay when open (fixed full-screen drawer)
- Close menu on link click, outside click, or ESC key
- Lock body scroll when menu is open using `useEffect` to toggle `overflow-hidden` on `document.body`

**Files Changed:**
- `src/components/Navbar.tsx`

**Implementation Details:**
```tsx
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Lock body scroll when menu open
useEffect(() => {
  if (isMobileMenuOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [isMobileMenuOpen]);

// Hamburger button (visible on mobile only)
<button onClick={() => setIsMobileMenuOpen(true)} className="sm:hidden">
  <Menu size={20} />
</button>

// Mobile menu overlay
{isMobileMenuOpen && (
  <div className="fixed inset-0 z-50 sm:hidden">
    <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
    <div className="fixed top-0 left-0 right-0 bg-[#161b27] p-6">
      {navLinks.map(link => (
        <Link key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)}>
          {link.label}
        </Link>
      ))}
    </div>
  </div>
)}
```

**Correctness Properties:**
- P1: WHEN viewport < 640px AND menu closed, THEN hamburger icon SHALL be visible
- P2: WHEN hamburger clicked, THEN menu SHALL open AND body scroll SHALL be locked
- P3: WHEN menu open AND link clicked, THEN menu SHALL close AND body scroll SHALL unlock
- P4: WHEN menu open AND overlay clicked, THEN menu SHALL close

---

### 2. Share Auction Functionality (AuctionDetail.tsx)

**Approach:**
- Replace no-op Share button with `handleShare` function
- Use `navigator.clipboard.writeText(window.location.href)` to copy URL
- Show `toast.success("Link copied!")` on success
- If clipboard API unavailable, show fallback modal with readonly input + manual copy button
- Add brief visual feedback (icon change or scale animation) on button click

**Files Changed:**
- `src/pages/AuctionDetail.tsx`

**Implementation Details:**
```tsx
const [showShareModal, setShowShareModal] = useState(false);

const handleShare = async () => {
  const url = window.location.href;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Auction link copied to clipboard!');
    } catch {
      setShowShareModal(true);
    }
  } else {
    setShowShareModal(true);
  }
};

// Replace button
<button onClick={handleShare} className="btn-secondary px-3 py-2">
  <Share2 size={14} />
</button>

// Fallback modal (if showShareModal)
{showShareModal && (
  <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
    <div className="modal-content">
      <h3>Share Auction</h3>
      <input readOnly value={window.location.href} />
      <button onClick={() => setShowShareModal(false)}>Close</button>
    </div>
  </div>
)}
```

**Correctness Properties:**
- P1: WHEN share button clicked AND clipboard available, THEN URL SHALL be copied AND toast SHALL show
- P2: WHEN share button clicked AND clipboard unavailable, THEN fallback modal SHALL open
- P3: THE copied URL SHALL equal `window.location.href`

---

### 3. Hero Connect Wallet Link (Home.tsx)

**Approach:**
- Replace `<Link to="/#connect">` with `<button onClick={() => connect()}>` 
- Already imports `useWallet` hook which provides `connect()` function
- Remove `to="/#connect"` prop, change element from `Link` to `button`
- Keep same styling (`btn-secondary`)

**Files Changed:**
- `src/pages/Home.tsx`

**Implementation Details:**
```tsx
const { isConnected, connect } = useWallet();

// Replace this:
<Link to="/#connect" className="btn-secondary text-base px-6 py-3">
  <Zap size={18} />
  Connect Wallet
</Link>

// With this:
<button onClick={() => connect()} className="btn-secondary text-base px-6 py-3">
  <Zap size={18} />
  Connect Wallet
</button>
```

**Correctness Properties:**
- P1: WHEN hero connect button clicked, THEN wallet modal SHALL open
- P2: WHEN wallet connected, THEN hero connect button SHALL not render

---

### 4. MyAuctions Demo Data Fallback (MyAuctions.tsx)

**Approach:**
- When `count === 0` and user is connected, generate demo auctions using the connected wallet address
- Create 3 demo auctions: one where user is creator, one where user is highest bidder (active), one where user is highest bidder (ended/won)
- Use similar structure to `DEMO_AUCTIONS` in Home.tsx but personalized to the wallet address

**Files Changed:**
- `src/pages/MyAuctions.tsx`

**Implementation Details:**
```tsx
function getDemoAuctionsForUser(address: string): AuctionData[] {
  const now = Date.now();
  return [
    {
      id: 101,
      creator: address, // User created this
      itemName: 'My Demo Auction',
      description: 'An auction you created (demo data)',
      startingPrice: 5,
      highestBid: 12,
      highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      endTime: new Date(now + 24 * 3600 * 1000),
      status: 'active',
    },
    {
      id: 102,
      creator: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      itemName: 'Demo Auction (You\'re Bidding)',
      description: 'An auction where you are the highest bidder (demo data)',
      startingPrice: 10,
      highestBid: 25,
      highestBidder: address, // User is highest bidder
      endTime: new Date(now + 12 * 3600 * 1000),
      status: 'active',
    },
    {
      id: 103,
      creator: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      itemName: 'Demo Auction (You Won)',
      description: 'An auction you won (demo data)',
      startingPrice: 15,
      highestBid: 50,
      highestBidder: address, // User won
      endTime: new Date(now - 1000),
      status: 'ended',
    },
  ];
}

// In the useEffect:
if (count === 0) {
  setAllAuctions(getDemoAuctionsForUser(wallet!.address));
  return;
}
```

**Correctness Properties:**
- P1: WHEN contract returns 0 auctions AND user connected, THEN demo data SHALL be generated
- P2: THE demo data SHALL include at least one auction in each tab (created, bidding, won)
- P3: THE demo auctions SHALL use the connected wallet address as creator or bidder

---

### 5. Environment Configuration (.env)

**Approach:**
- Create `.env` file in project root (copy from `.env.example`)
- Leave `VITE_CONTRACT_ADDRESS` empty by default (demo mode)
- Include all other environment variables with testnet defaults

**Files Changed:**
- `.env` (new file)

**Implementation Details:**
```env
VITE_CONTRACT_ADDRESS=
VITE_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
```

**Correctness Properties:**
- P1: THE .env file SHALL exist in project root
- P2: WHEN VITE_CONTRACT_ADDRESS is empty, THE app SHALL use demo data
- P3: WHEN VITE_CONTRACT_ADDRESS is set, THE app SHALL call the contract

---

### 6. Demo Mode Indicator (DemoBanner.tsx + App.tsx)

**Approach:**
- Create new component `src/components/DemoBanner.tsx`
- Check `import.meta.env.VITE_CONTRACT_ADDRESS` — if falsy, render banner
- Banner is a fixed top bar (yellow/amber theme) with warning icon and message
- Add to `App.tsx` above `<Navbar>`

**Files Changed:**
- `src/components/DemoBanner.tsx` (new)
- `src/App.tsx`

**Implementation Details:**
```tsx
// DemoBanner.tsx
import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  
  if (contractAddress) return null;
  
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <AlertTriangle size={16} className="text-amber-400" />
        <span className="text-amber-200">
          Demo Mode: No contract deployed. All data is simulated.
        </span>
      </div>
    </div>
  );
}

// App.tsx
import DemoBanner from './components/DemoBanner';

<BrowserRouter>
  <ScrollToTop />
  <div className="flex flex-col min-h-screen">
    <DemoBanner />
    <Navbar />
    ...
```

**Correctness Properties:**
- P1: WHEN VITE_CONTRACT_ADDRESS is empty, THEN banner SHALL be visible
- P2: WHEN VITE_CONTRACT_ADDRESS is set, THEN banner SHALL not render
- P3: THE banner SHALL be visible on all pages

---

### 7. Wallet Reconnection Loading State (useWallet.ts + WalletConnect.tsx)

**Approach:**
- Add `isReconnecting` state to `useWallet` hook
- Set to `true` at start of `reconnect()`, `false` when done (success or failure)
- Expose `isReconnecting` in return value
- In `WalletConnect.tsx`, show subtle "Reconnecting…" indicator when `isReconnecting` is true

**Files Changed:**
- `src/hooks/useWallet.ts`
- `src/components/WalletConnect.tsx`

**Implementation Details:**
```tsx
// useWallet.ts
const [isReconnecting, setIsReconnecting] = useState(false);

const reconnect = async (walletId: string) => {
  setIsReconnecting(true);
  try {
    const Kit = getWalletKit();
    Kit.setWallet(walletId);
    const { address } = await Kit.getAddress();
    if (address) {
      setWallet({ address, walletId, walletName: walletId, isConnected: true });
    }
  } catch {
    clearWalletFromStorage();
  } finally {
    setIsReconnecting(false);
  }
};

return {
  wallet,
  isConnecting,
  isReconnecting, // NEW
  isConnected: !!wallet?.isConnected,
  ...
};

// WalletConnect.tsx
const { wallet, isConnected, isConnecting, isReconnecting, error, connect, disconnect, clearError } = useWallet();

// Show reconnecting indicator
{isReconnecting && !isConnected && (
  <div className="flex items-center gap-2 text-xs text-slate-400">
    <div className="spinner" style={{ width: 12, height: 12 }} />
    Reconnecting…
  </div>
)}
```

**Correctness Properties:**
- P1: WHEN reconnect starts, THEN isReconnecting SHALL be true
- P2: WHEN reconnect completes (success or fail), THEN isReconnecting SHALL be false
- P3: WHEN isReconnecting is true, THEN loading indicator SHALL be visible

---

### 8. Buffer Polyfill Verification (vite.config.ts)

**Approach:**
- Read `vite.config.ts` and verify it has:
  - `define: { global: 'globalThis' }`
  - `resolve.alias: { buffer: 'buffer' }`
  - `optimizeDeps.esbuildOptions.define: { global: 'globalThis' }`
- Current file already has all three — document as verified
- No changes needed

**Files Changed:**
- None (already correct)

**Verification:**
```typescript
// vite.config.ts already has:
define: {
  global: 'globalThis',
},
resolve: {
  alias: {
    buffer: 'buffer',
  },
},
optimizeDeps: {
  esbuildOptions: {
    define: {
      global: 'globalThis',
    },
  },
},
```

**Correctness Properties:**
- P1: THE vite.config.ts SHALL define global as globalThis
- P2: THE vite.config.ts SHALL alias buffer to buffer package
- P3: WHEN app runs in browser, THEN Stellar SDK SHALL not throw Buffer errors

---

### 9. 404 Fallback Route (NotFound.tsx + App.tsx)

**Approach:**
- Create new page `src/pages/NotFound.tsx` with styled 404 message
- Match app's dark theme (purple accents, slate text)
- Include links to home and auctions
- Add catch-all route `<Route path="*" element={<NotFound />} />` to `App.tsx`

**Files Changed:**
- `src/pages/NotFound.tsx` (new)
- `src/App.tsx`

**Implementation Details:**
```tsx
// NotFound.tsx
import { Link } from 'react-router-dom';
import { Home, Gavel } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-purple-500/20 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home size={16} />
            Go Home
          </Link>
          <Link to="/" className="btn-secondary">
            <Gavel size={16} />
            View Auctions
          </Link>
        </div>
      </div>
    </div>
  );
}

// App.tsx
import NotFound from './pages/NotFound';

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/create" element={<CreateAuction />} />
  <Route path="/auction/:id" element={<AuctionDetail />} />
  <Route path="/my-auctions" element={<MyAuctions />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Correctness Properties:**
- P1: WHEN user navigates to undefined route, THEN NotFound page SHALL render
- P2: THE NotFound page SHALL include link to home
- P3: THE NotFound page SHALL maintain navbar layout

---

### 10. Contract Verification (contracts/auction/src/lib.rs)

**Approach:**
- Read the Soroban contract source
- Verify function signatures match what `src/lib/contract.ts` expects:
  - `create_auction(creator: Address, item_name: String, description: String, starting_price: i128, duration_secs: u64)`
  - `place_bid(auction_id: u64, bidder: Address, amount: i128)`
  - `end_auction(auction_id: u64)`
  - `get_auction(auction_id: u64) -> Auction`
  - `get_auction_count() -> u64`
- Verify `Auction` struct has fields: id, creator, item_name, description, starting_price, highest_bid, highest_bidder, end_time, status
- Verify `AuctionStatus` enum has `Active` and `Ended` variants
- Verify `bid_plcd` event is emitted in `place_bid`
- Document any mismatches

**Files Changed:**
- None (verification only)

**Verification Checklist:**
- ✅ `create_auction` signature matches
- ✅ `place_bid` signature matches
- ✅ `end_auction` signature matches
- ✅ `get_auction` signature matches
- ✅ `get_auction_count` signature matches
- ✅ `Auction` struct fields match
- ✅ `AuctionStatus` enum variants match
- ✅ `bid_plcd` event emitted

**Correctness Properties:**
- P1: FOR ALL contract functions, THE Rust signature SHALL match TypeScript expectations
- P2: THE Auction struct SHALL contain all fields expected by parseAuctionScVal
- P3: THE bid_plcd event SHALL be emitted when place_bid succeeds

---

### 11. Production Build Validation

**Approach:**
- Run `npm run build` after all changes
- Run `npm run lint` after all changes
- Verify no errors in either command
- Document any warnings that need addressing

**Files Changed:**
- None (validation only)

**Validation Commands:**
```bash
npm run build  # Should complete without errors
npm run lint   # Should pass without errors
```

**Correctness Properties:**
- P1: WHEN `npm run build` runs, THEN it SHALL complete without errors
- P2: WHEN `npm run lint` runs, THEN it SHALL pass without errors
- P3: THE built app SHALL load in browser without console errors

---

## Correctness Properties Summary

### Global Properties
1. **Mobile Responsiveness**: All pages SHALL be usable on viewports from 320px to 2560px wide
2. **Wallet State Consistency**: Wallet connection state SHALL persist across page reloads
3. **Demo Mode Transparency**: Users SHALL always know when using demo data vs live contract
4. **Error Handling**: All user actions SHALL provide clear feedback (success, error, or loading)

### Component-Specific Properties
- **Navbar**: Mobile menu SHALL close on navigation, outside click, or ESC key
- **Share Button**: URL copy SHALL work via clipboard API or fallback modal
- **Hero Link**: Connect button SHALL open wallet modal, not navigate to /#connect
- **MyAuctions**: Demo data SHALL populate all three tabs when no contract deployed
- **DemoBanner**: SHALL only render when VITE_CONTRACT_ADDRESS is empty
- **WalletConnect**: SHALL show reconnecting state during auto-reconnect
- **NotFound**: SHALL render for all undefined routes

### Build Properties
- **TypeScript**: All files SHALL compile without type errors
- **ESLint**: All files SHALL pass linting rules
- **Vite Build**: Production build SHALL complete successfully
- **Buffer Polyfill**: Stellar SDK SHALL work in browser without Buffer errors

---

## Testing Strategy

### Manual Testing Checklist
1. **Mobile Navigation**: Test on mobile viewport (< 640px), verify menu opens/closes
2. **Share Button**: Test clipboard copy, test fallback modal (disable clipboard in devtools)
3. **Hero Link**: Click "Connect Wallet" in hero, verify modal opens
4. **MyAuctions Demo**: Clear contract address, connect wallet, verify all tabs have data
5. **Demo Banner**: Clear contract address, verify banner appears on all pages
6. **Wallet Reconnect**: Connect wallet, refresh page, verify "Reconnecting…" appears briefly
7. **404 Page**: Navigate to `/invalid-route`, verify 404 page renders
8. **Build**: Run `npm run build`, verify success
9. **Lint**: Run `npm run lint`, verify no errors

### Property-Based Testing Opportunities
- **Mobile Menu State**: Property: Menu open state SHALL always match body scroll lock state
- **Share URL**: Property: Copied URL SHALL always equal `window.location.href`
- **Demo Data Generation**: Property: Generated demo auctions SHALL always include user's address
- **Banner Visibility**: Property: Banner visible IFF `VITE_CONTRACT_ADDRESS` is falsy

---

## Implementation Order

1. **Environment Configuration** (.env) — Foundation for demo mode detection
2. **Demo Mode Indicator** (DemoBanner) — Visible feedback for demo mode
3. **Buffer Polyfill Verification** (vite.config.ts) — Already done, document only
4. **Contract Verification** (lib.rs) — Verify before implementing features
5. **Mobile Navigation** (Navbar) — Core UX improvement
6. **Hero Connect Link** (Home) — Simple fix, high impact
7. **Share Functionality** (AuctionDetail) — Moderate complexity
8. **MyAuctions Demo Data** (MyAuctions) — Requires demo mode to be working
9. **Wallet Reconnection State** (useWallet + WalletConnect) — Polish
10. **404 Page** (NotFound + App) — Final touch
11. **Production Build** — Validation

---

## Risk Assessment

### Low Risk
- Hero connect link fix (simple button change)
- Environment configuration (file creation)
- Buffer polyfill verification (already correct)
- 404 page (new isolated component)

### Medium Risk
- Mobile navigation (state management, body scroll lock)
- Share functionality (clipboard API + fallback)
- Demo mode indicator (environment variable detection)
- MyAuctions demo data (address-based generation)

### High Risk
- Wallet reconnection state (timing, race conditions)
- Contract verification (Rust ↔ TypeScript alignment)
- Production build (dependency conflicts, bundle size)

### Mitigation Strategies
- **Mobile Navigation**: Test on real devices, not just browser devtools
- **Share Functionality**: Test clipboard API availability across browsers
- **Wallet Reconnection**: Add timeout to prevent infinite reconnect loops
- **Contract Verification**: Use automated tests to verify ScVal parsing
- **Production Build**: Test build on clean `node_modules` install

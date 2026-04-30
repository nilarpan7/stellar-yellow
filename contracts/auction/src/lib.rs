#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol,
    vec, Vec,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────
const AUCTION_COUNT_KEY: Symbol = symbol_short!("AUC_CNT");

// ─── Error Codes ─────────────────────────────────────────────────────────────
const ERR_AUCTION_NOT_FOUND: u32 = 1;
const ERR_AUCTION_ALREADY_ENDED: u32 = 2;
const ERR_BID_TOO_LOW: u32 = 3;
const ERR_NOT_EXPIRED: u32 = 4;
const ERR_AUCTION_NOT_ACTIVE: u32 = 5;
const ERR_NOT_CREATOR: u32 = 6;
const ERR_HAS_BIDS: u32 = 7;
const ERR_ALREADY_CANCELLED: u32 = 8;

// ─── Data Types ──────────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AuctionStatus {
    Active,
    Ended,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Auction {
    pub id: u64,
    pub creator: Address,
    pub item_name: String,
    pub description: String,
    pub starting_price: i128,
    pub highest_bid: i128,
    pub highest_bidder: Address,
    pub end_time: u64,
    pub status: AuctionStatus,
}

#[contracttype]
pub enum DataKey {
    Auction(u64),
    AuctionCount,
}

// ─── Contract ────────────────────────────────────────────────────────────────
#[contract]
pub struct AuctionContract;

#[contractimpl]
impl AuctionContract {
    /// Create a new auction. Returns the new auction ID.
    pub fn create_auction(
        env: Env,
        creator: Address,
        item_name: String,
        description: String,
        starting_price: i128,
        duration_secs: u64,
    ) -> u64 {
        // Authenticate the creator — must be signed by the caller's wallet
        creator.require_auth();

        // Get next auction ID
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0u64);
        let auction_id = count + 1;

        let end_time = env.ledger().timestamp() + duration_secs;

        let auction = Auction {
            id: auction_id,
            creator: creator.clone(),
            item_name: item_name.clone(),
            description: description.clone(),
            starting_price,
            highest_bid: starting_price,
            highest_bidder: creator.clone(),
            end_time,
            status: AuctionStatus::Active,
        };

        // Store auction
        env.storage()
            .instance()
            .set(&DataKey::Auction(auction_id), &auction);

        // Update count
        env.storage()
            .instance()
            .set(&DataKey::AuctionCount, &auction_id);

        // Extend TTL
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit event
        env.events().publish(
            (symbol_short!("auc_crt"), auction_id),
            (creator, starting_price, end_time),
        );

        auction_id
    }

    /// Place a bid on an auction.
    pub fn place_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        amount: i128,
    ) {
        // Authenticate the bidder
        bidder.require_auth();

        let key = DataKey::Auction(auction_id);
        let mut auction: Auction = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic_with_error(&env, ERR_AUCTION_NOT_FOUND));

        // Check auction is active
        if auction.status != AuctionStatus::Active {
            panic_with_error(&env, ERR_AUCTION_NOT_ACTIVE);
        }

        // Check not expired
        if env.ledger().timestamp() >= auction.end_time {
            panic_with_error(&env, ERR_AUCTION_ALREADY_ENDED);
        }

        // Check bid amount is higher than current highest bid
        if amount <= auction.highest_bid {
            panic_with_error(&env, ERR_BID_TOO_LOW);
        }

        let prev_highest_bidder = auction.highest_bidder.clone();
        let prev_highest_bid = auction.highest_bid;

        auction.highest_bid = amount;
        auction.highest_bidder = bidder.clone();

        env.storage().instance().set(&key, &auction);
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit bid placed event
        env.events().publish(
            (symbol_short!("bid_plcd"), auction_id),
            (bidder.clone(), amount, prev_highest_bidder, prev_highest_bid),
        );
    }

    /// End an auction after its expiry time.
    pub fn end_auction(env: Env, auction_id: u64) {
        let key = DataKey::Auction(auction_id);
        let mut auction: Auction = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic_with_error(&env, ERR_AUCTION_NOT_FOUND));

        if auction.status != AuctionStatus::Active {
            panic_with_error(&env, ERR_AUCTION_ALREADY_ENDED);
        }

        if env.ledger().timestamp() < auction.end_time {
            panic_with_error(&env, ERR_NOT_EXPIRED);
        }

        auction.status = AuctionStatus::Ended;
        env.storage().instance().set(&key, &auction);
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit auction ended event
        env.events().publish(
            (symbol_short!("auc_end"), auction_id),
            (auction.highest_bidder.clone(), auction.highest_bid),
        );
    }

    /// Cancel an auction (only creator, only before external bids).
    pub fn cancel_auction(env: Env, auction_id: u64, caller: Address) {
        // Authenticate the caller
        caller.require_auth();

        let key = DataKey::Auction(auction_id);
        let mut auction: Auction = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic_with_error(&env, ERR_AUCTION_NOT_FOUND));

        // Only creator can cancel
        if auction.creator != caller {
            panic_with_error(&env, ERR_NOT_CREATOR);
        }

        // Can only cancel active auctions
        if auction.status != AuctionStatus::Active {
            panic_with_error(&env, ERR_ALREADY_CANCELLED);
        }

        // Can only cancel if no external bids (highest bidder is still creator)
        if auction.highest_bidder != auction.creator {
            panic_with_error(&env, ERR_HAS_BIDS);
        }

        auction.status = AuctionStatus::Cancelled;
        env.storage().instance().set(&key, &auction);
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit auction cancelled event
        env.events().publish(
            (symbol_short!("auc_cncl"), auction_id),
            caller,
        );
    }

    /// Get auction data.
    pub fn get_auction(env: Env, auction_id: u64) -> Auction {
        env.storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .unwrap_or_else(|| panic_with_error(&env, ERR_AUCTION_NOT_FOUND))
    }

    /// Get the current highest bid and bidder.
    pub fn get_highest_bid(env: Env, auction_id: u64) -> (Address, i128) {
        let auction: Auction = env
            .storage()
            .instance()
            .get(&DataKey::Auction(auction_id))
            .unwrap_or_else(|| panic_with_error(&env, ERR_AUCTION_NOT_FOUND));

        (auction.highest_bidder, auction.highest_bid)
    }

    /// Get total number of auctions created.
    pub fn get_auction_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0u64)
    }

    /// Get list of recent auction IDs (up to 20).
    pub fn get_recent_auctions(env: Env) -> Vec<u64> {
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0u64);

        let start = if count > 20 { count - 20 } else { 0 };
        let mut result = vec![&env];
        let mut i = count;
        while i > start {
            result.push_back(i);
            i -= 1;
        }
        result
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
fn panic_with_error(env: &Env, code: u32) -> ! {
    use soroban_sdk::Error;
    panic!("{}", code);
}

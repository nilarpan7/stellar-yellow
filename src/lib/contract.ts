import {
  rpc as SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  ScInt,
  Contract,
} from '@stellar/stellar-sdk';
import { NETWORK_CONFIG, CONTRACT_ADDRESS, getSorobanRpcUrl, xlmToStroops } from './stellar';
import { parseContractError } from './errors';

// ─── Auction Data Types ───────────────────────────────────────────────────────
export interface AuctionData {
  id: number;
  creator: string;
  itemName: string;
  description: string;
  startingPrice: number; // in XLM
  highestBid: number;    // in XLM
  highestBidder: string;
  endTime: Date;
  status: 'active' | 'ended' | 'cancelled';
  imageUrl?: string;
}

export interface BidEvent {
  auctionId: number;
  bidder: string;
  amount: number; // in XLM
  txHash: string;
  timestamp: Date;
  eventType?: string;
}

// ─── RPC Server ───────────────────────────────────────────────────────────────
function getRpcServer(): SorobanRpc.Server {
  return new SorobanRpc.Server(getSorobanRpcUrl(), {
    allowHttp: getSorobanRpcUrl().startsWith('http://'),
  });
}

// ─── ScVal Helpers ────────────────────────────────────────────────────────────
function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function u64ToScVal(n: number): xdr.ScVal {
  return new ScInt(n, { type: 'u64' }).toU64();
}

function i128ToScVal(xlmAmount: number): xdr.ScVal {
  const stroops = xlmToStroops(xlmAmount);
  return new ScInt(stroops, { type: 'i128' }).toI128();
}

function stringToScVal(str: string): xdr.ScVal {
  return xdr.ScVal.scvString(Buffer.from(str, 'utf-8'));
}

// ─── ScVal Parsers ────────────────────────────────────────────────────────────
function scValToString(val: xdr.ScVal): string {
  try { return Buffer.from(val.bytes()).toString('utf-8'); } catch { return ''; }
}

function scValToAddress(val: xdr.ScVal): string {
  try { return Address.fromScVal(val).toString(); } catch { return ''; }
}

function scValToI128(val: xdr.ScVal): bigint {
  try {
    // hi is Int64 (signed), lo is Uint64 (unsigned) — must mask lo to 64 bits
    const hi = BigInt(val.i128().hi().toString());
    const lo = BigInt(val.i128().lo().toString()) & 0xFFFFFFFFFFFFFFFFn;
    return (hi << 64n) | lo;
  } catch { return 0n; }
}

function scValToU64(val: xdr.ScVal): bigint {
  try { return BigInt(val.u64().toString()); } catch { return 0n; }
}

function parseAuctionScVal(val: xdr.ScVal, id: number): AuctionData | null {
  try {
    const fields = val.map()!;
    const get = (key: string) => fields.find(f => {
      try { return Buffer.from(f.key().sym()).toString() === key; } catch { return false; }
    })?.val();

    const endTimeSecs = Number(scValToU64(get('end_time')!));
    const highestBidStroops = scValToI128(get('highest_bid')!);
    const startingPriceStroops = scValToI128(get('starting_price')!);

    // Soroban enum variants are returned as scvVec([scvSymbol("VariantName"), ...])
    // or as scvSymbol("VariantName") for unit variants.
    const statusVal = get('status');
    let status: 'active' | 'ended' | 'cancelled' = 'active';
    if (statusVal) {
      try {
        const switchName = statusVal.switch().name;
        if (switchName === 'scvSymbol') {
          // Unit enum variant — check the symbol name
          const sym = Buffer.from(statusVal.sym()).toString();
          if (sym === 'Ended' || sym === 'ended') {
            status = 'ended';
          } else if (sym === 'Cancelled' || sym === 'cancelled') {
            status = 'cancelled';
          }
        } else if (switchName === 'scvVec') {
          // Tuple/struct enum variant — first element is the discriminant symbol
          const vec = statusVal.vec();
          if (vec && vec.length > 0) {
            const discriminant = vec[0];
            if (discriminant.switch().name === 'scvSymbol') {
              const sym = Buffer.from(discriminant.sym()).toString();
              if (sym === 'Ended' || sym === 'ended') {
                status = 'ended';
              } else if (sym === 'Cancelled' || sym === 'cancelled') {
                status = 'cancelled';
              }
            }
          }
        }
      } catch {
        status = 'active';
      }
    }

    return {
      id,
      creator: scValToAddress(get('creator')!),
      itemName: scValToString(get('item_name')!),
      description: scValToString(get('description')!),
      startingPrice: Number(startingPriceStroops) / 10_000_000,
      highestBid: Number(highestBidStroops) / 10_000_000,
      highestBidder: scValToAddress(get('highest_bidder')!),
      endTime: new Date(endTimeSecs * 1000),
      status,
    };
  } catch (e) {
    console.error('Failed to parse auction:', e);
    return null;
  }
}

// ─── Contract Client ──────────────────────────────────────────────────────────
export class AuctionContractClient {
  private server: SorobanRpc.Server;
  private contractId: string;

  constructor(contractId: string = CONTRACT_ADDRESS) {
    this.server = getRpcServer();
    this.contractId = contractId;
    
    // Log contract initialization
    console.log('AuctionContractClient initialized:', {
      contractId: this.contractId,
      rpcUrl: getSorobanRpcUrl(),
      network: NETWORK_CONFIG.networkPassphrase,
    });
    
    if (!this.contractId) {
      console.error('WARNING: No contract address configured!');
    }
  }

  private async simulateAndSend(
    operation: xdr.Operation,
    sourceAddress: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate
    const simResult = await this.server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }
    if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
      throw new Error('Transaction simulation failed');
    }

    // Assemble
    const assembled = SorobanRpc.assembleTransaction(tx, simResult).build();
    const txXdr = assembled.toXDR();

    // Sign
    const signedXdr = await signTransaction(txXdr);

    // Submit
    const response = await this.server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, NETWORK_CONFIG.networkPassphrase)
    );

    if (response.status === 'ERROR') {
      throw new Error(`Transaction failed: ${response.errorResult?.toXDR('base64')}`);
    }

    // Poll for confirmation
    const hash = response.hash;
    let getResponse = await this.server.getTransaction(hash);
    let retries = 0;
    while (getResponse.status === 'NOT_FOUND' && retries < 15) {
      await new Promise(r => setTimeout(r, 2000));
      getResponse = await this.server.getTransaction(hash);
      retries++;
    }

    if (getResponse.status === 'FAILED') {
      throw new Error('Transaction confirmed but failed on-chain');
    }

    return hash;
  }

  // ── create_auction ──────────────────────────────────────────────────────────
  async createAuction(params: {
    creator: string;
    itemName: string;
    description: string;
    startingPriceXlm: number;
    durationHours: number;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<{ txHash: string; auctionId?: number }> {
    try {
      const contract = new Contract(this.contractId);
      const durationSecs = Math.round(params.durationHours * 3600);

      const op = contract.call(
        'create_auction',
        addressToScVal(params.creator),
        stringToScVal(params.itemName),
        stringToScVal(params.description),
        i128ToScVal(params.startingPriceXlm),
        u64ToScVal(durationSecs),
      );

      const txHash = await this.simulateAndSend(op, params.creator, params.signTransaction);
      return { txHash };
    } catch (err) {
      throw parseContractError(err);
    }
  }

  // ── place_bid ───────────────────────────────────────────────────────────────
  async placeBid(params: {
    auctionId: number;
    bidder: string;
    bidAmountXlm: number;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<string> {
    try {
      const contract = new Contract(this.contractId);
      const op = contract.call(
        'place_bid',
        u64ToScVal(params.auctionId),
        addressToScVal(params.bidder),
        i128ToScVal(params.bidAmountXlm),
      );
      return await this.simulateAndSend(op, params.bidder, params.signTransaction);
    } catch (err) {
      throw parseContractError(err);
    }
  }

  // ── end_auction ─────────────────────────────────────────────────────────────
  async endAuction(params: {
    auctionId: number;
    caller: string;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<string> {
    try {
      const contract = new Contract(this.contractId);
      const op = contract.call('end_auction', u64ToScVal(params.auctionId));
      return await this.simulateAndSend(op, params.caller, params.signTransaction);
    } catch (err) {
      throw parseContractError(err);
    }
  }

  // ── cancel_auction ──────────────────────────────────────────────────────────
  async cancelAuction(params: {
    auctionId: number;
    caller: string;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<string> {
    try {
      const contract = new Contract(this.contractId);
      const op = contract.call(
        'cancel_auction',
        u64ToScVal(params.auctionId),
        addressToScVal(params.caller)
      );
      return await this.simulateAndSend(op, params.caller, params.signTransaction);
    } catch (err) {
      throw parseContractError(err);
    }
  }

  // ── get_auction (read-only simulation) ─────────────────────────────────────
  async getAuction(auctionId: number): Promise<AuctionData | null> {
    try {
      const contract = new Contract(this.contractId);
      const op = contract.call('get_auction', u64ToScVal(auctionId));

      // Use testnet deployer account for read-only simulation
      const sourceKey = 'GCOQZSZBG7RLGKHDRRUL4DQZP5QGYFDYORFSZVWOGTQGMHNP6XN6LG3Q';
      const account = await this.server.getAccount(sourceKey).catch((err) => {
        console.error('Failed to get source account for getAuction:', err);
        return null;
      });
      if (!account) {
        console.error('Source account not found for getAuction simulation');
        return null;
      }

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      }).addOperation(op).setTimeout(10).build();

      const sim = await this.server.simulateTransaction(tx);
      
      if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
        console.error('getAuction simulation failed:', sim);
        return null;
      }
      
      if (!sim.result) {
        console.error('No result from getAuction simulation');
        return null;
      }

      return parseAuctionScVal(sim.result.retval, auctionId);
    } catch (err) {
      console.error('Error getting auction:', err);
      return null;
    }
  }

  // ── get_auction_count ───────────────────────────────────────────────────────
  async getAuctionCount(): Promise<number> {
    try {
      const contract = new Contract(this.contractId);
      const op = contract.call('get_auction_count');

      // Use testnet deployer account for read-only simulation
      const sourceKey = 'GCOQZSZBG7RLGKHDRRUL4DQZP5QGYFDYORFSZVWOGTQGMHNP6XN6LG3Q';
      const account = await this.server.getAccount(sourceKey).catch((err) => {
        console.error('Failed to get source account:', err);
        return null;
      });
      if (!account) {
        console.error('Source account not found for simulation');
        return 0;
      }

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      }).addOperation(op).setTimeout(10).build();

      const sim = await this.server.simulateTransaction(tx);
      
      if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
        console.error('Simulation failed:', sim);
        return 0;
      }
      
      if (!sim.result) {
        console.error('No result from simulation');
        return 0;
      }

      return Number(scValToU64(sim.result.retval));
    } catch (err) {
      console.error('Error getting auction count:', err);
      return 0;
    }
  }

  // ── getEvents (polling) ─────────────────────────────────────────────────────
  async getRecentEvents(startLedger?: number): Promise<BidEvent[]> {
    try {
      // Always get the latest ledger to ensure we're within the retention window
      let ledgerStart: number;
      try {
        const latestLedger = await this.server.getLatestLedger();
        // Stellar testnet keeps ~120k ledgers (~7 days)
        // Go back 500 ledgers (~40 minutes) to catch recent events
        // If startLedger is provided and recent enough, use it
        const minValidLedger = latestLedger.sequence - 100000; // Safe margin
        if (startLedger && startLedger > minValidLedger) {
          ledgerStart = startLedger;
        } else {
          ledgerStart = Math.max(minValidLedger, latestLedger.sequence - 500);
        }
      } catch (err) {
        console.error('Failed to get latest ledger:', err);
        return [];
      }

      const events = await this.server.getEvents({
        startLedger: ledgerStart,
        filters: [
          {
            type: 'contract',
            contractIds: [this.contractId],
          },
        ],
        pagination: { limit: 50 },
      } as any);

      return events.events
        .filter(e => {
          const topics = e.topic;
          if (!topics || topics.length === 0) return false;
          try {
            const first = topics[0];
            if (first.switch().name !== 'scvSymbol') return false;
            const name = Buffer.from(first.sym()).toString();
            return name === 'bid_plcd' || name === 'auc_crt' || name === 'auc_end' || name === 'auc_cncl';
          } catch {
            return false;
          }
        })
        .map(e => {
          const topics = e.topic;
          const eventName = (() => {
            try { return Buffer.from(topics[0].sym()).toString(); } catch { return ''; }
          })();
          const auctionId = Number(scValToU64(topics[1]));
          let bidder = '';
          let amount = 0;

          if (eventName === 'bid_plcd') {
            try {
              const valueVec = e.value.vec();
              if (valueVec && valueVec.length >= 2) {
                bidder = scValToAddress(valueVec[0]);
                amount = Number(scValToI128(valueVec[1])) / 10_000_000;
              }
            } catch {
              try { bidder = scValToAddress(e.value); } catch { /* ignore */ }
            }
          } else if (eventName === 'auc_crt') {
            try {
              const valueVec = e.value.vec();
              if (valueVec && valueVec.length >= 1) {
                bidder = scValToAddress(valueVec[0]);
                if (valueVec.length >= 2) {
                  amount = Number(scValToI128(valueVec[1])) / 10_000_000;
                }
              }
            } catch {
              try { bidder = scValToAddress(e.value); } catch { /* ignore */ }
            }
          } else if (eventName === 'auc_end') {
            try {
              const valueVec = e.value.vec();
              if (valueVec && valueVec.length >= 2) {
                bidder = scValToAddress(valueVec[0]);
                amount = Number(scValToI128(valueVec[1])) / 10_000_000;
              }
            } catch { /* ignore */ }
          }

          return {
            auctionId,
            bidder,
            amount,
            txHash: e.txHash,
            timestamp: new Date(),
            eventType: eventName,
          };
        });
    } catch (err: any) {
      console.error('Event polling error:', err?.message || err?.response?.data || JSON.stringify(err));
      return [];
    }
  }
}

// ─── Default Client Instance ──────────────────────────────────────────────────
export const auctionClient = new AuctionContractClient();

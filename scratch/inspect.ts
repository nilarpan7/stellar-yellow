import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';

const kit = StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [new FreighterModule()],
});

console.log(Object.getOwnPropertyNames(StellarWalletsKit.prototype));
console.log(Object.keys(StellarWalletsKit));

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * BlockRateMarket Deploy Module
 *
 * Deploy lần đầu:
 *   npx hardhat ignition deploy ignition/modules/BlockRateMarket.ts --network hardhatMainnet
 *
 * Deploy lên Sepolia:
 *   npx hardhat ignition deploy ignition/modules/BlockRateMarket.ts --network sepolia
 */
export default buildModule("BlockRateMarketModule", (m) => {
  const market = m.contract("BlockRateMarket");

  return { market };
});

/**
 * BlockRate — Contract Addresses
 * Cập nhật địa chỉ sau khi deploy bằng Hardhat Ignition
 *
 * Deploy local:
 *   npx hardhat ignition deploy ignition/modules/BlockRateMarket.ts --network hardhatMainnet
 *
 * Deploy Sepolia:
 *   npx hardhat ignition deploy ignition/modules/BlockRateMarket.ts --network sepolia
 */
const CONTRACT_ADDRESSES = {
  // Hardhat local node (chainId 31337)
  31337: {
    BlockRateMarket: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    ReviewRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
  // Sepolia testnet (chainId 11155111)
  11155111: {
    BlockRateMarket: "",  // ← Điền sau khi deploy
    ReviewRegistry: "",   // ← Điền sau khi deploy
  },
};

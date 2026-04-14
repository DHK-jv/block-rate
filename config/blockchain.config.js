import { ethers } from "ethers";

/**
 * CẤU HÌNH KẾT NỐI BLOCKCHAIN (WEB3)
 * 
 * File này khởi tạo các thành phần cần thiết để ứng dụng tương tác với mạng lưới Blockchain.
 * - Provider: Cổng kết nối để đọc dữ liệu từ mạng lưới (RPC).
 * - Wallet: Ví điện tử dùng để ký và gửi các giao dịch (cần PRIVATE_KEY).
 * - Contract: Đối tượng đại diện cho Smart Contract đã deploy để gọi các hàm submitReview, getReview,...
 * 
 * Sử dụng pattern khởi tạo một lần (Singleton) để tối ưu hiệu năng.
 */
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

let wallet = null;
let contract = null;

// Định nghĩa giao diện (ABI) của Smart Contract
const abi = [
  "function submitReview(string calldata orderId, string calldata productId, bytes32 reviewHash) external",
  "function hasReviewed(string calldata orderId) external view returns (bool)",
  "function getReviewByOrder(string calldata orderId) external view returns (uint256, bytes32, address, uint256)",
];

try {
  // Chỉ khởi tạo Wallet và Contract nếu có đủ thông tin cấu hình trong .env
  if (process.env.PRIVATE_KEY) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    if (process.env.CONTRACT_ADDRESS) {
      contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
    }
  } else {
    console.warn("⚠️ KHÔNG TÌM THẤY PRIVATE_KEY. Các tính năng Blockchain sẽ bị vô hiệu hóa.");
  }
} catch (error) {
  console.error("⚠️ Lỗi khởi tạo Ethereum:", error.message);
}

export { provider, wallet, contract };

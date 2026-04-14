import { ethers } from "ethers";

/**
 * TẠO MÃ BẢM (HASH) ĐỂ ĐỊNH DANH ĐÁNH GIÁ TRÊN BLOCKCHAIN
 * 
 * Mục đích: Tạo ra một "dấu vân tay" kỹ thuật số duy nhất cho mỗi đánh giá.
 * Mã băm này bao gồm tất cả các thông tin quan trọng để đảm bảo tính toàn vẹn:
 * - orderId: Ràng buộc đánh giá với một đơn hàng cụ thể (mỗi đơn chỉ đánh giá 1 lần).
 * - userId: Xác định danh tính người thực hiện đánh giá.
 * - productId: Đảm bảo đánh giá không bị "di chuyển" sang sản phẩm khác trong DB.
 * - rating: Bảo vệ số sao, ngăn chặn thay đổi điểm số.
 * - content: Bảo vệ nội dung nhận xét, ngăn chặn việc sửa đổi lời văn.
 * 
 * Logic kỹ thuật:
 * 1. Chuyển đổi tất cả ID sang chuỗi (String) để tránh lỗi định dạng ObjectId của Mongo.
 * 2. Cắt bỏ khoảng trắng dư thừa ở nội dung (`trim()`) để đảm bảo mã băm luôn giống nhau.
 * 3. Sử dụng chuẩn Keccak256 (chuẩn của Ethereum) để băm dữ liệu.
 */
export const generateReviewHash = (orderId, userId, productId, rating, content) => {
  const rawString = `${orderId.toString()}-${userId.toString()}-${productId.toString()}-${rating}-${content.trim()}`;
  return ethers.keccak256(ethers.toUtf8Bytes(rawString));
};

# BlockRate — Decentralized Transparent Review Marketplace

**BlockRate** là một nền tảng thương mại điện tử hiện đại, nơi sự minh bạch được đặt lên hàng đầu. Mọi đánh giá sản phẩm đều được bảo chứng bởi công nghệ Blockchain và kiểm duyệt thông minh bằng AI, giúp loại bỏ hoàn toàn các nhận xét giả mạo hoặc thiếu khách quan.

---

## 🚀 Tính Năng Cốt Lõi

- **Web3 Wallet Login**: Đăng nhập nhanh chóng, bảo mật thông qua ví **MetaMask**. Không cần mật khẩu, không cần đăng ký rườm rà.
- **On-Chain Verification**: Mỗi đánh giá được mã hóa (hashing) và lưu trữ trên Blockchain. Người dùng có thể kiểm chứng tính toàn vẹn của dữ liệu bất cứ lúc nào.
- **AI Moderation**: Tích hợp **Llama 3.1 (Groq API)** để tự động nhận diện và chặn các nội dung spam, xúc phạm hoặc đánh giá rác.
- **Local Spam Guard**: Hệ thống lọc rác cục bộ giúp tối ưu hiệu năng và bảo vệ tài nguyên API.
- **Premium UI/UX**: Giao diện được thiết kế theo phong cách tối giản, sang trọng với các hiệu ứng chuyển động mượt mà và Layout lưới sản phẩm đồng nhất.

---

## 🛠 Tech Stack

- **Backend**: Node.js (ES Modules), Express.js
- **Database**: MongoDB (Mongoose)
- **Web3**: Ethers.js, Hardhat (Smart Contracts)
- **AI**: Groq SDK (Llama 3.1 8B Instant)
- **Frontend**: Pug Template Engine, Vanilla CSS, Bootstrap 5

---

## 📦 Hướng Dẫn Cài Đặt

### 1. Clone & Install
```bash
git clone https://github.com/DHK-jv/block-rate.git
cd block-rate
npm install
```

### 2. Cấu Hình Biến Môi Trường
Copy file mẫu và điền các thông số cần thiết:
```bash
cp .env.example .env
```
Các thông số quan trọng cần điền:
- `MONGO_URI`: Địa chỉ kết nối MongoDB Atlas hoặc Local.
- `GROQ_API_KEY`: API Key từ Groq Cloud để chạy kiểm duyệt AI.
- `RPC_URL`: Endpoint của mạng Blockchain (ví dụ: Sepolia, BSC Testnet).
- `CONTRACT_ADDRESS`: Địa chỉ Smart Contract đã deploy.
- `PRIVATE_KEY`: Khóa bí mật của ví dùng để ký các giao dịch lưu trữ trên chuỗi.

### 3. Khởi Chạy
```bash
# Chế độ phát triển (Auto-reload)
npm run dev
```

---

## 🏗 Kiến Trúc Hệ Thống

1. **Mua Hàng**: Khi người dùng mua hàng, một `Order` sẽ được tạo trong MongoDB với trạng thái `pending` đánh giá.
2. **Đánh Giá**: Người dùng gửi nhận xét kèm số sao.
3. **Kiểm Duyệt**: 
   - Bước 1: `quickSpamCheck` (RegEx/Local) lọc các nội dung rác rõ ràng.
   - Bước 2: `moderateReview` (AI) phân tích ngữ cảnh và cảm xúc của nhận xét.
4. **Lưu Trữ Chuỗi**: Nếu hợp lệ, hệ thống sẽ tính toán `reviewHash` và gửi giao dịch `submitReview` lên Smart Contract.
5. **Đồng Bộ Hoá**: Trạng thái `Order` được cập nhật sang `reviewed`, đảm bảo mỗi giao dịch chỉ được đánh giá một lần duy nhất.

---

## 🤝 Liên Hệ

Nếu bạn có bất kỳ câu hỏi hoặc đóng góp nào, vui lòng liên hệ thông qua GitHub Issues.

---
*© 2026 BlockRate — Minh bạch trong từng đánh giá.*

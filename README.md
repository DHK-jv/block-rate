# BlockRate

Dự án Đánh giá Sản phẩm trên nền tảng Blockchain. Dưới đây là hướng dẫn cài đặt để chạy dự án.

## Hướng dẫn Cài đặt & Chạy dự án (Dành cho người mới clone)

1. **Cài đặt thư viện:**
   Sau khi clone code về, bạn cần cài đặt các gói thư viện Node.js bằng lệnh:
   ```bash
   npm install
   ```

2. **Cấu hình môi trường (.env):**
   Dự án yêu cầu các biến môi trường để chạy (kết nối MongoDB, config bảo mật,...). Bạn hãy copy file `.env.example` thành file `.env` và điền các thông tin thực tế của bạn vào file `.env` đó:
   ```bash
   cp .env.example .env
   ```
   *(Sửa file `.env` theo thông số database và port của bạn)*

3. **Chạy Server:**
   Chạy lệnh sau để khởi động server (có tích hợp nodemon tự động reload):
   ```bash
   npm run dev
   ```

---

## Danh sách ảnh và chú thích

Tài liệu này liệt kê các sản phẩm hiện có trong mockup giao diện (HTML) của dự án BlockRate nhưng chưa có hình ảnh thực tế. Các hình ảnh này hiện đang được thay thế bằng các Placeholder (biểu tượng Material Icons).

Dưới đây là danh sách các sản phẩm cần bổ sung ảnh và gợi ý chú thích (caption) cho từng ảnh.


| Sản phẩm | Phân loại (Gợi ý) | Chú thích ảnh (Caption) ghi chú |
| :--- | :--- | :--- |
| **Tai nghe Studio Pro X** | Điện tử | Tai nghe Studio Pro X với công nghệ chống ồn chủ động và âm thanh Hi-Res. |
| **Đồng hồ Chrono Elite** | Phụ kiện | Đồng hồ Chrono Elite thiết kế sang trọng, tích hợp tính năng theo dõi sức khỏe. |
| **Máy pha Cà phê AutoBrew** | Gia dụng | Máy pha cà phê AutoBrew mini cho văn phòng và gia đình, pha Espresso trong 30 giây. |
| **Giày Sneaker Velocity** | Thời trang | Giày Sneaker Velocity thiết kế năng động, đế giảm chấn êm ái cho mọi hoạt động. |
| **Bàn phím cơ Aurora RGB** | Điện tử | Bàn phím cơ Aurora RGB với Switch tùy chỉnh và đèn nền 16.8 triệu màu. |
| **Smartphone Galaxy S23** | Điện thoại | Smartphone Galaxy S23 với hệ thống camera đột phá và hiệu năng mạnh mẽ. |
| **Giày Air Cloud Walk** | Thời trang | Giày Air Cloud Walk siêu nhẹ, mang lại cảm giác "đi trên mây" suốt cả ngày. |
| **Laptop Pro 14 M3** | Điện tử | Laptop Pro 14 chip M3 hiệu năng vượt trội cho đồ họa và lập trình chuyên nghiệp. |
| **Ethereum Hardware Wallet X-200** | Công nghệ | Ví lạnh Ethereum Hardware Wallet X-200 bảo mật đa tầng, quản lý tài sản số an toàn. |

## Ghi chú chung

1. **Vị trí lưu trữ**: Ảnh sản phẩm nên được lưu vào thư mục `frontend/images/products/`.
2. **Định dạng**: Khuyến khích sử dụng định dạng `.webp` hoặc `.png` (nền trong suốt) để tối ưu hóa hiệu năng và thẩm mỹ.
3. **Kích thước**: Nên sử dụng ảnh có tỉ lệ 1:1 (Aspect Ratio square) để phù hợp với bố cục lưới (Grid) hiện tại của sản phẩm.
4. **Trạng thái phân loại**: Các sản phẩm trên hiện đang được phân loại sơ bộ dựa trên nội dung trong mã nguồn. Có thể điều chỉnh lại khi có danh mục chính thức.

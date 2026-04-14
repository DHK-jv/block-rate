import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Nhập các cấu hình và route
import * as database from "./config/configDatabase.js";
import initWebRoutes from "./routes/client/route.js";
import { attachUser } from "./middleware/auth.middleware.js";
import authRouter from "./routes/client/auth.router.js";

// Xử lý đường dẫn tuyệt đối cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình View Engine (Pug)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middlewares cơ bản
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Middleware tùy chỉnh: Gắn thông tin người dùng vào locals để hiển thị trên UI
app.use(attachUser);

// Khai báo Routes
app.use("/", authRouter);
initWebRoutes(app);

/**
 * KHỞI CHẠY HỆ THỐNG
 * 1. Kết nối cơ sở dữ liệu MongoDB.
 * 2. Lắng nghe kết nối HTTP trên PORT đã cấu hình.
 */
async function startServer() {
  try {
    await database.connect();
    console.log("✅ MongoDB đã kết nối thành công");
    app.listen(PORT, () => console.log(`🚀 Hệ thống đang chạy tại: http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ Lỗi khởi động hệ thống:", error.message);
    process.exit(1); // Dừng chương trình nếu không kết nối được DB
  }
}

startServer();
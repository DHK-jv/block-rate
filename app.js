import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import * as database from "./config/configDatabase.js";
import initWebRoutes from "./routes/client/route.js";
import { attachUser } from "./middleware/auth.middleware.js";
import authRouter from "./routes/client/auth.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/products-data", express.static("/home/khangjv/WorkSpace/Products"));
app.use(attachUser);

app.use("/", authRouter);
initWebRoutes(app);

async function startServer() {
  try {
    await database.connect();
    console.log("✅ DB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Connect to database error:", error.message);
    process.exit(1);
  }
}

startServer();
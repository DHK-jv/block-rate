import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import "dotenv/config";

const productsDir = "/home/khangjv/WorkSpace/Products";

const Product = mongoose.model("Product", new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  brand: String,
  category: String,
  badge: String,
  oldPrice: Number,
  rating: Number,
  reviews: Number,
  stock: Number,
  image: String,
  tags: [String]
}), "Products");

async function syncProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for Synchronization");

    const folders = fs.readdirSync(productsDir).filter(f => fs.statSync(path.join(productsDir, f)).isDirectory());

    for (const folder of folders) {
      const infoPath = path.join(productsDir, folder, "info.json");
      if (!fs.existsSync(infoPath)) continue;

      const data = JSON.parse(fs.readFileSync(infoPath, "utf8"));
      const productId = data._id;

      // Detect image in folder
      const files = fs.readdirSync(path.join(productsDir, folder));
      const imageFile = files.find(f => f.startsWith("image."));

      if (imageFile) {
        data.image = `/products-data/${folder}/${imageFile}`;
      }

      // Cleanup _id to avoid immutable error
      delete data._id;

      const updated = await Product.findByIdAndUpdate(productId, data, { new: true });
      if (updated) {
        console.log(`✅ Synced: ${updated.name} (Image: ${updated.image})`);
      } else {
        console.warn(`⚠️ Product not found in DB: ${data.name}`);
      }
    }

    console.log("\n🚀 All products synchronized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync Error:", err);
    process.exit(1);
  }
}

syncProducts();

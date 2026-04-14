import Product from "../../models/product.model.js";

export const getHomePage = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== "all" ? { category } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.json({ success: true, products });
    }
    res.render("./client/pages/home/index", { products });
  } catch (err) {
    console.error(err);
    res.send("Lỗi server");
  }
};
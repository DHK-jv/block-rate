import Product from "../../models/product.model.js";
import * as Response from "../../utils/response.util.js";

export const getHomePage = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== "all" ? { category } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return Response.success(res, "Đã tải danh mục sản phẩm", { products });
    }

    res.render("./client/pages/home/index", { products });
  } catch (err) {
    return Response.error(res, "Lỗi server khi tải trang chủ", 500, err);
  }
};
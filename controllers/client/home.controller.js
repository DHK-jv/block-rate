import Product from "../../models/product.model.js";
import * as Response from "../../utils/response.util.js";

export const getHomePage = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== "all" ? { category } : {};
    
    // Sử dụng aggregate để nối dữ liệu từ bảng Reviews thật. Mặc định Products collection trong Mongo là Products, Review là Reviews.
    const products = await Product.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "Reviews",
          localField: "_id",
          foreignField: "product",
          as: "realReviews"
        }
      },
      {
        $addFields: {
          reviews: { $size: "$realReviews" },
          rating: {
            $cond: {
              if: { $eq: [{ $size: "$realReviews" }, 0] },
              then: 0,
              else: { $round: [{ $avg: "$realReviews.rating" }, 1] }
            }
          }
        }
      },
      {
        $project: {
          realReviews: 0 // Xóa mảng lớn để tối ưu băng thông
        }
      }
    ]);

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return Response.success(res, "Đã tải danh mục sản phẩm", { products });
    }

    res.render("./client/pages/home/index", { products });
  } catch (err) {
    return Response.error(res, "Lỗi server khi tải trang chủ", 500, err);
  }
};
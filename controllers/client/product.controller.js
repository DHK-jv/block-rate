import Product from "../../models/product.model.js";
import Review from "../../models/review.model.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import { contract } from "../../config/blockchain.config.js";
import * as Response from "../../utils/response.util.js";
import { generateReviewHash } from "../../utils/crypto.util.js";

/**
 * HIỂN THỊ CHI TIẾT SẢN PHẨM VÀ DANH SÁCH ĐÁNH GIÁ
 */
export const detail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Sản phẩm không tồn tại");

    const reviews = await Review.find({ product: req.params.id }).populate("user", "walletAddress");

    let hasBought = false;
    let pendingReviewCount = 0;
    
    // Nếu người dùng đã đăng nhập, kiểm tra lịch sử mua hàng để mở khóa quyền đánh giá
    if (res.locals.currentUser) {
      const allCompletedOrders = await Order.find({
        userId: res.locals.currentUser._id,
        productId: req.params.id,
        status: "completed",
      });

      if (allCompletedOrders.length > 0) {
        hasBought = true;
        // Mỗi lượt mua hàng "completed" mà chưa đánh giá sẽ được tính là 1 quyền đánh giá
        pendingReviewCount = allCompletedOrders.filter(o => o.reviewStatus === "pending").length;
      }
    }

    let onchainReviewCount = 0;
    if (contract) {
      try {
        const onchainTotal = await contract.totalReviewsByProduct(req.params.id.toString());
        onchainReviewCount = Number(onchainTotal);
      } catch (err) {
        console.error("⚠️ Không thể lấy tổng đánh giá từ on-chain (có thể Contract chưa được deploy bản mới):", err.message);
      }
    }

    res.render("./client/pages/product/product-detail", { 
      product, 
      reviews, 
      hasBought, 
      pendingReviewCount, 
      onchainReviewCount 
    });
  } catch (error) {
    console.error("[detail]", error);
    res.status(500).send("Lỗi máy chủ khi tải chi tiết sản phẩm");
  }
};

/**
 * XỬ LÝ MUA HÀNG (MÔ PHỎNG GIAO DỊCH THÀNH CÔNG)
 */
export const buy = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return Response.error(res, "Sản phẩm không tồn tại", 404);

    // Tạo đơn hàng mới trong cơ sở dữ liệu
    await Order.create({
      userId: req.user._id,
      productId: req.params.id,
      price: product.price,
      status: "completed",
    });

    // Cập nhật danh sách sản phẩm đã sở hữu của người dùng
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { purchasedProducts: req.params.id },
    });

    return Response.success(res, "Mua hàng thành công");
  } catch (err) {
    return Response.error(res, "Lỗi khi xử lý đơn hàng", 500, err);
  }
};

/**
 * GỬI ĐÁNH GIÁ VÀ LƯU TRỮ HASH LÊN BLOCKCHAIN (CƠ CHẾ ROLLBACK AN TOÀN)
 */
export const review = async (req, res) => {
  let newReview = null;
  const { rating, content } = req.body;
  const { id: productId } = req.params;
  const userId = req.user._id;

  try {
    if (!rating || !content) return Response.error(res, "Vui lòng nhập đầy đủ thông tin", 400);
    if (!contract) return Response.error(res, "Hệ thống blockchain chưa được cấu hình", 500);

    // Kiểm tra quyền đánh giá (Đã hoàn thành đơn hàng và chưa đánh giá)
    const order = await Order.findOne({
      userId, productId, status: "completed", reviewStatus: "pending",
    });
    if (!order) return Response.error(res, "Bạn chưa có đơn hàng hợp lệ để đánh giá", 403);

    // BƯỚC 1: LƯU NHÁP VÀO MONGODB (DRAFT)
    // Lưu trước để đảm bảo nội dung đánh giá được giữ lại trong DB local
    newReview = await Review.create({
      product: productId, 
      user: userId, 
      rating, 
      content,
      orderID: order._id,
      txHash: "" // Chưa có txHash vì chưa gửi Blockchain
    });

    // BƯỚC 2: TẠO MÃ BĂM (HASH) TỪ DỮ LIỆU VỪA LƯU
    const reviewHash = generateReviewHash(order._id, userId, productId, rating, content);

    // BƯỚC 3: GỬI LÊN BLOCKCHAIN (TRY-CATCH RIÊNG)
    try {
      // Gửi giao dịch và đợi xác nhận từ mạng lưới
      const tx = await contract.submitReview(order._id.toString(), productId.toString(), reviewHash);
      await tx.wait();

      // BƯỚC 4: HOÀN TẤT (COMMIT)
      // Cập nhật txHash và đánh dấu đơn hàng thành công
      newReview.txHash = tx.hash;
      await newReview.save();
      await newReview.populate("user", "walletAddress");

      order.reviewStatus = "reviewed";
      await order.save();

      return Response.success(res, "Đánh giá của bạn đã được ghi nhận on-chain", {
        review: newReview,
        txHash: tx.hash
      }, 201);

    } catch (blockchainError) {
      // BƯỚC 5: HOÀN TÁC (ROLLBACK)
      // Nếu Blockchain lỗi (nonce, gas, mạng...), xóa bản ghi nháp ở MongoDB để tránh sai lệch
      if (newReview) {
        await Review.findByIdAndDelete(newReview._id);
      }
      console.error("🚨 LỖI BLOCKCHAIN - ĐÃ HOÀN TÁC MONGODB:", blockchainError.message);
      return Response.error(res, "Lỗi kết nối Blockchain. Vui lòng thử lại sau.", 500, blockchainError.message);
    }

  } catch (err) {
    if (err.code === 11000) {
      return Response.error(res, "Bạn đã thực hiện đánh giá cho đơn hàng này rồi.", 400);
    }
    return Response.error(res, "Lỗi hệ thống khi xử lý đánh giá", 500, err);
  }
};

/**
 * XÁC MINH TÍNH TOÀN VẸN CỦA ĐÁNH GIÁ (BLOCKCHAIN AUDIT)
 */
export const verifyReview = async (req, res) => {
  try {
    const reviewDoc = await Review.findById(req.params.id);
    if (!reviewDoc) return Response.error(res, "Nhận xét không tồn tại", 404);

    // BƯỚC 1: Tính toán lại mã băm (Local Hash) từ dữ liệu hiện tại trong MongoDB
    const localHash = generateReviewHash(
      reviewDoc.orderID,
      reviewDoc.user,
      reviewDoc.product,
      reviewDoc.rating,
      reviewDoc.content
    );

    if (!contract) return Response.error(res, "Hệ thống blockchain chưa cấu hình", 500);

    // BƯỚC 2: Truy vấn mã băm gốc (Chain Hash) đã được lưu trên Blockchain lúc gửi đánh giá
    let chainHash = null;
    try {
      const chainData = await contract.getReviewByOrder(reviewDoc.orderID.toString());
      chainHash = chainData[1];
    } catch (err) {
      // Nếu không tìm thấy trên Blockchain (ví dụ: sau khi reset contract), coi như không xác thực được
      console.warn(`[verifyReview] Review for order ${reviewDoc.orderID} not found on-chain.`);
    }

    /**
     * BƯỚC 3: SO SÁNH
     * Nếu localHash === chainHash: Dữ liệu trong Database hoàn toàn khớp với dữ liệu lúc người dùng gửi.
     * Nếu khác nhau hoặc không tìm thấy: Báo lỗi tính toàn vẹn.
     */
    return res.json({
      success: chainHash ? (localHash.toLowerCase() === chainHash.toLowerCase()) : false,
      localHash,
      chainHash: chainHash || "N/A (Not Found)",
      statusText: chainHash ? (localHash.toLowerCase() === chainHash.toLowerCase() ? "Chưa bị sửa đổi" : "Dữ liệu đã bị can thiệp") : "Không tìm thấy trên Blockchain"
    });
  } catch (err) {
    return Response.error(res, "Lỗi khi thực hiện xác minh minh bạch", 500, err);
  }
};

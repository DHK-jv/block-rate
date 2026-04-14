import { ethers } from "ethers";
import Product from "../../models/product.model.js";
import Review from "../../models/review.model.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";

const abi = [
  "function submitReview(string calldata orderId, string calldata productId, bytes32 reviewHash) external",
  "function hasReviewed(string calldata orderId) external view returns (bool)",
  "function getReviewByOrder(string calldata orderId) external view returns (uint256, bytes32, address, uint256)",
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
let wallet, contract;
try {
  if (process.env.PRIVATE_KEY) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    if (process.env.CONTRACT_ADDRESS) {
      contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
    }
  } else {
    console.warn("⚠️ PRIVATE_KEY not found. Blockchain features disabled.");
  }
} catch (error) {
  console.error("⚠️ Ethereum wallet init error:", error.message);
}

export const detail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const reviews = await Review.find({ product: req.params.id }).populate("user", "walletAddress");

    let hasBought = false;
    let pendingReviewCount = 0;
    if (res.locals.currentUser) {
      const allCompletedOrders = await Order.find({
        userId: res.locals.currentUser._id,
        productId: req.params.id,
        status: "completed",
      });

      if (allCompletedOrders.length > 0) {
        hasBought = true;
        // Đếm số đơn chưa đánh giá đễ có 'token' đánh giá
        pendingReviewCount = allCompletedOrders.filter(o => o.reviewStatus === "pending").length;
      }
    }

    res.render("./client/pages/product/product-detail", { product, reviews, hasBought, pendingReviewCount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

export const buy = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });

    await Order.create({
      userId: req.user._id,
      productId: req.params.id,
      price: product.price,
      status: "completed",
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { purchasedProducts: req.params.id },
    });

    return res.json({ success: true, message: "Mua hàng thành công" });
  } catch (err) {
    console.error("[buy]", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

export const review = async (req, res) => {
  try {
    const { rating, content } = req.body;
    const { id: productId } = req.params;
    const userId = req.user._id;

    if (!rating || !content)
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });

    if (!contract) return res.status(500).json({ success: false, message: "Hệ thống blockchain chưa được cấu hình" });

    const order = await Order.findOne({
      userId, productId, status: "completed", reviewStatus: "pending",
    });
    if (!order)
      return res.status(403).json({ success: false, message: "Bạn chưa có đơn hàng hợp lệ để đánh giá" });

    const alreadyOnChain = await contract.hasReviewed(order._id.toString());
    if (alreadyOnChain)
      return res.status(400).json({ success: false, message: "Order đã review trên blockchain" });

    const reviewHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${order._id.toString()}-${userId.toString()}-${productId.toString()}-${rating}-${content.trim()}`)
    );

    const tx = await contract.submitReview(order._id.toString(), productId.toString(), reviewHash);
    await tx.wait();

    const newReview = await Review.create({
      product: productId, user: userId, rating, content,
      orderID: order._id, txHash: tx.hash,
    });
    await newReview.populate("user", "walletAddress");

    order.reviewStatus = "reviewed";
    await order.save();

    return res.status(201).json({ success: true, review: newReview, txHash: tx.hash });
  } catch (err) {
    console.error("[review]", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

export const verifyReview = async (req, res) => {
  try {
    const reviewDoc = await Review.findById(req.params.id);
    if (!reviewDoc || !reviewDoc.orderID || !reviewDoc.user) return res.json({ success: false, message: "Nhận xét thiếu dữ liệu gốc" });

    const localHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${reviewDoc.orderID.toString()}-${reviewDoc.user.toString()}-${reviewDoc.product.toString()}-${reviewDoc.rating}-${reviewDoc.content.trim()}`)
    );

    if (!contract) return res.json({ success: false, message: "Hệ thống blockchain chưa được cấu hình" });

    const chainData = await contract.getReviewByOrder(reviewDoc.orderID.toString());
    const chainHash = chainData[1];

    res.json({
      success: localHash.toLowerCase() === chainHash.toLowerCase(),
      localHash,
      chainHash,
    });
  } catch (err) {
    console.error("[verifyReview]", err);
    res.json({ success: false });
  }
};

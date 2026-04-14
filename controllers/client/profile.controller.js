import User from "../../models/user.model.js";

export const purchasedList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("purchasedProducts");
    res.render("./client/pages/profile/purchased-list", {
      title: "Sản phẩm đã mua",
      products: user.purchasedProducts,
    });
  } catch (err) {
    console.error("[purchasedList]", err);
    res.send("Lỗi server");
  }
};
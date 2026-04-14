import User from "../../models/user.model.js";
import { sendTokenResponse } from "../../utils/Jwt.util.js";

export const walletLogin = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, message: "Missing wallet address" });
    }

    const lowerAddress = address.toLowerCase();

    // Tìm user theo ví, nếu chưa có thì tạo mới
    let user = await User.findOne({ walletAddress: lowerAddress });
    if (!user) {
      user = await User.create({ walletAddress: lowerAddress });
    }

    return sendTokenResponse(res, user, 200);
  } catch (err) {
    console.error("[walletLogin]", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "lax" });
  return res.status(200).json({ success: true, message: "Đã đăng xuất" });
};

export const loginPage = (req, res) => {
  if (res.locals.currentUser) {
    return res.redirect("/home");
  }
  res.render("client/pages/auth/login", {
    titlePage: "Đăng nhập - BlockRate",
  });
};
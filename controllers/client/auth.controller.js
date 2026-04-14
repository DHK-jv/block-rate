import User from "../../models/user.model.js";
import { sendTokenResponse } from "../../utils/Jwt.util.js";
import * as Response from "../../utils/response.util.js";

export const walletLogin = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return Response.error(res, "Thiếu địa chỉ ví", 400);
    }

    const lowerAddress = address.toLowerCase();

    // Tìm user theo ví, nếu chưa có thì tạo mới
    let user = await User.findOne({ walletAddress: lowerAddress });
    if (!user) {
      user = await User.create({ walletAddress: lowerAddress });
    }

    return sendTokenResponse(res, user, 200);
  } catch (err) {
    return Response.error(res, "Lỗi khi đăng nhập bằng ví", 500, err);
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "lax" });
  return Response.success(res, "Đã đăng xuất thành công");
};

export const loginPage = (req, res) => {
  if (res.locals.currentUser) {
    return res.redirect("/");
  }
  res.render("client/pages/auth/login", {
    titlePage: "Đăng nhập - BlockRate",
  });
};
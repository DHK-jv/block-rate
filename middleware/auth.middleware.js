import User from "../models/user.model.js";
import { verifyToken } from "../utils/Jwt.util.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });

  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ success: false, message: "Tài khoản không tồn tại" });
  req.user = user;
  next();
};

export const protectPage = async (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) return res.redirect("/login");
  const decoded = verifyToken(token);
  if (!decoded) return res.redirect("/login");
  const user = await User.findById(decoded.id);
  if (!user) return res.redirect("/login");
  res.locals.currentUser = user;
  req.user = user;
  next();
};

export const attachUser = async (req, res, next) => {
  const token = req.cookies?.jwt;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await User.findById(decoded.id);
      res.locals.currentUser = user || null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  next();
};
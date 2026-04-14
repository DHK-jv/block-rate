import indexRouter from "./index.router.js";
import productRouter from "./product.router.js";
import authRouter from "./auth.router.js";
import profileRouter from "./profile.router.js";

const initWebRoutes = (app) => {
  app.use("/", indexRouter);
  app.use("/product", productRouter);
  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
};

export default initWebRoutes;
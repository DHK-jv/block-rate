import { Router } from "express";
import * as controller from "../../controllers/client/auth.controller.js";

const router = Router();

router.get("/login", controller.loginPage);
router.post("/api/auth/wallet-login", controller.walletLogin);
router.post("/api/auth/logout", controller.logout);

export default router;
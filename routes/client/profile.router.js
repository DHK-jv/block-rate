import { Router } from "express";
import { protectPage } from "../../middleware/auth.middleware.js";
import { purchasedList } from "../../controllers/client/profile.controller.js";

const router = Router();
router.get("/purchased-list", protectPage, purchasedList);

export default router;
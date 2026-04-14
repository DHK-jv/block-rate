import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { moderateReview } from "../../middleware/review-validation.middleware.js";
import * as controller from "../../controllers/client/product.controller.js";

const router = Router();

router.post("/buy/:id", protect, controller.buy);
router.post("/review/:id", protect, moderateReview, controller.review);
router.get("/verify-review/:id", controller.verifyReview);
router.get("/:id", controller.detail);

export default router;
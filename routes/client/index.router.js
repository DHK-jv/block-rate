import { Router } from "express";
import { getHomePage } from "../../controllers/client/home.controller.js";

const router = Router();
router.get("/", getHomePage);

export default router;
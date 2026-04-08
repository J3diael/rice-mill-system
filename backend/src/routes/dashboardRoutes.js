import express from "express";
import { getDashboardController } from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard",verifyToken, getDashboardController);

export default router;
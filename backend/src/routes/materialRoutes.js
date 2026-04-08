import express from "express";
import { getMaterials } from "../controllers/materialController.js";
import { createMaterialController } from "../controllers/materialController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/materials", verifyToken, getMaterials);
router.post("/materials", verifyToken, createMaterialController);


export default router;
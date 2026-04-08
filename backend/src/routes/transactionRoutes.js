import express from "express";
import { createTransactionController, getTransactionsController } from "../controllers/transactionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/transactions", verifyToken, createTransactionController);
router.get("/transactions", verifyToken, getTransactionsController);

export default router;

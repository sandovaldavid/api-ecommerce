import express from "express";
import {
    createPayment,
    getPaymentById,
    getPaymentsByOrderId,
    updatePaymentStatus,
    getPaymentStats
} from "../controllers/paymentController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware
router.use(authJwt.verifyToken);

// Public routes (authenticated users)
router.post("/", createPayment);
router.get("/:id", getPaymentById);
router.get("/order/:orderId", getPaymentsByOrderId);

// Admin routes
router.patch("/:id/status", authJwt.isAdmin, updatePaymentStatus);
router.get("/stats", authJwt.isAdmin, getPaymentStats);

export default router;
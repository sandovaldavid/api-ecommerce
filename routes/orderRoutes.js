import express from "express";
import {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
    getOrderStats,
    getAllOrders
} from "../controllers/orderController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware
router.use(authJwt.verifyToken);

// Admin routes
router.get("/admin/orders", authJwt.isAdmin, getAllOrders);
router.get("/admin/stats", authJwt.isAdmin, getOrderStats);
router.patch("/:id/status", authJwt.isAdmin, updateOrderStatus);

// Public routes (authenticated users)
router.post("/", createOrder);
router.get("/user/:userId", getOrdersByUserId);
router.get("/:id", getOrderById);

export default router;
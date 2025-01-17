import express from "express";
import {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
    getOrderStats
} from "../controllers/orderController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware
router.use(authJwt.verifyToken);

// Public routes (authenticated users)
router.post("/", createOrder);
router.get("/:id", getOrderById);
router.get("/user/:userId", getOrdersByUserId);

// Admin routes
router.patch("/:id/status", authJwt.isAdmin, updateOrderStatus);
router.get("/stats", authJwt.isAdmin, getOrderStats);

export default router;
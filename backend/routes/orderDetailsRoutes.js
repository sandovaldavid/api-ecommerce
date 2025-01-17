import express from "express";
import {
    createOrderDetails,
    getOrderDetailsByOrderId,
    updateOrderDetails,
    deleteOrderDetails
} from "../controllers/orderDetailsController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware
router.use(authJwt.verifyToken);

// Routes
router.post("/", createOrderDetails);
router.get("/order/:orderId", getOrderDetailsByOrderId);
router.put("/:id", updateOrderDetails);
router.delete("/:id", deleteOrderDetails);

export default router;
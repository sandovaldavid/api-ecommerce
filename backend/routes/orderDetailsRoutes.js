import express from "express";
import { createOrderDetails, getOrderDetailsByOrderId } from "../controllers/orderDetailsController.js";

const router = express.Router();

router.post("/", createOrderDetails);
router.get("/:orden_id", getOrderDetailsByOrderId);

export default router;
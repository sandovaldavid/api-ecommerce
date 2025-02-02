import express from "express";
import { createStripePaymentIntent, confirmStripePayment } from "../controllers/stripeController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.post("/create-payment-intent", authJwt.verifyToken, createStripePaymentIntent);
router.get("/confirm-payment/:paymentIntentId", authJwt.verifyToken, confirmStripePayment);

export default router;
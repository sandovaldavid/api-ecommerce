import { createPaymentIntent, confirmPayment } from "../services/stripeService.js";
import Order from "../models/order.js";

export const createStripePaymentIntent = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const paymentIntent = await createPaymentIntent(order.total);

        await order.update({
            paymentIntentId: paymentIntent.id,
            paymentStatus: "pending"
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error("Payment intent error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const confirmStripePayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await confirmPayment(paymentIntentId);
        const order = await Order.findOne({
            where: { paymentIntentId }
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if (paymentIntent.status === "succeeded") {
            await order.update({
                payment_status: "completed",
                status: "paid"
            });
        }

        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error("Payment confirmation error:", error);
        res.status(500).json({ error: error.message });
    }
};
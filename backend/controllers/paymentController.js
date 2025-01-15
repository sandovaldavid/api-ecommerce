import Payment from "../models/payment.js";

export const createPayment = async (req, res) => {
    try {
        const { orden_id: ordenId, payment_method: paymentMethod, amount } = req.body;
        const payment = await Payment.create({ orderId: ordenId, payment_method: paymentMethod, amount });
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
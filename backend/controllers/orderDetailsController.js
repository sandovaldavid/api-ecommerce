import OrderDetails from "../models/orderDetails.js";

export const createOrderDetails = async (req, res) => {
    try {
        const { orderId, productId, quantity, unitPrice } = req.body;
        const subtotal = quantity * unitPrice;
        const orderDetails = await OrderDetails.create({ orderId, productId, quantity, unitPrice, subtotal });
        res.status(201).json(orderDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderDetailsByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await OrderDetails.findAll({ where: { orderId } });
        res.status(200).json(orderDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
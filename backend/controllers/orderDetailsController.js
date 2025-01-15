import OrderDetails from "../models/orderDetails.js";

export const createOrderDetails = async (req, res) => {
    try {
        const { orden_id: ordenId, producto_id: productoId, cantidad, precio_unitario: precioUnitario } = req.body;
        const subtotal = cantidad * precioUnitario;
        const orderDetails = await OrderDetails.create({ orden_id: ordenId, productId: productoId, cantidad: quantity, unitPrice: precioUnitario, subtotal });
        res.status(201).json(orderDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderDetailsByOrderId = async (req, res) => {
    try {
        const { orden_id: ordenId } = req.params;
        const orderDetails = await OrderDetails.findAll({ where: { orden_id: ordenId } });
        res.status(200).json(orderDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
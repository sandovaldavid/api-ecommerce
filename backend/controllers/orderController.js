import Order from "../models/order.js";

export const createOrder = async (req, res) => {
    try {
        const { usuario_id: usuarioId, productos, total } = req.body;
        const order = await Order.create({ userId: usuarioId, total });
    
        for (const producto of productos) {
            await order.addProduct(producto.id, { through: { quantity: producto.quantity, unitPrice: producto.price } });
        }
    
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
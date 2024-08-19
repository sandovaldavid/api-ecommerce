import Order from '../models/order.js';

export const createOrder = async (req, res) => {
  try {
    const {usuario_id, productos, total} = req.body;
    const order = await Order.create({usuario_id, total});
    
    for (const producto of productos) {
      await order.addProduct(producto.id, {through: {cantidad: producto.cantidad, precio_unitario: producto.precio}});
    }
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};


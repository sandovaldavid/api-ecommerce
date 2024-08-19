import OrderDetails from '../models/orderDetails.js';

export const createOrderDetails = async (req, res) => {
  try {
    const {orden_id, producto_id, cantidad, precio_unitario} = req.body;
    const subtotal = cantidad * precio_unitario;
    const orderDetails = await OrderDetails.create({orden_id, producto_id, cantidad, precio_unitario, subtotal});
    res.status(201).json(orderDetails);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getOrderDetailsByOrderId = async (req, res) => {
  try {
    const {orden_id} = req.params;
    const orderDetails = await OrderDetails.findAll({where: {orden_id}});
    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

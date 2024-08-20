import Payment from '../models/payment.js';

export const createPayment = async (req, res) => {
  try {
    const {orden_id, payment_method, amount} = req.body;
    const payment = await Payment.create({orden_id, payment_method, amount});
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

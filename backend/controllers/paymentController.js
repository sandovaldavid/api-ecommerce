import Payment from "../models/payment.js";
import { Errors } from "../middlewares/errorHandler.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { sequelize } from "../models/index.js";

// Create a new payment
export const createPayment = async (req, res, next) => {
    try {
        const {
            orderId,
            payment_method,
            amount
        } = req.body;

        // Input validation
        if (!orderId || !payment_method || !amount) {
            throw new Errors.ValidationError("Missing required fields", {
                required: ["orderId", "payment_method", "amount"]
            });
        }

        // Create payment with transaction
        const payment = await sequelize.transaction(async (t) => {
            return Payment.create({
                orderId,
                payment_method,
                amount,
                payment_status: "pending",
                created_at: new Date()
            }, { transaction: t });
        });

        return res.status(201).json({
            message: "Payment created successfully",
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

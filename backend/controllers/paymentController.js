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

// Get payment by ID
export const getPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Authorization check
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "payment",
            {
                resourceId: id,
                model: Payment,
                attributes: ["id", "orderId", "payment_method", "payment_status", "amount", "created_at"]
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        return res.status(200).json({
            message: "Payment retrieved successfully",
            data: authResult.resource
        });
    } catch (error) {
        next(error);
    }
};

// Get payments by order ID
export const getPaymentsByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const payments = await Payment.findAll({
            where: { orderId },
            order: [["created_at", "DESC"]]
        });

        return res.status(200).json({
            message: "Payments retrieved successfully",
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// Get payment statistics (admin only)
export const getPaymentStats = async (req, res, next) => {
    try {
        const stats = await Payment.findAll({
            attributes: [
                'payment_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            group: ['payment_status']
        });

        return res.status(200).json({
            message: "Payment statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};


import OrderDetails from "../models/orderDetails.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import { Errors } from "../middlewares/errorHandler.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { sequelize } from "../models/index.js";

// Create order details
export const createOrderDetails = async (req, res, next) => {
    try {
        const { orderId, productId, quantity, unitPrice } = req.body;

        // Input validation
        if (!orderId || !productId || !quantity || !unitPrice) {
            throw new Errors.ValidationError("Missing required fields", {
                required: ["orderId", "productId", "quantity", "unitPrice"]
            });
        }

        // Validate order exists and authorization
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: orderId,
                model: Order
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        // Create order details with transaction
        const orderDetails = await sequelize.transaction(async (t) => {
            const subtotal = quantity * unitPrice;
            return OrderDetails.create({
                orderId,
                productId,
                quantity,
                unitPrice,
                subtotal
            }, { transaction: t });
        });

        return res.status(201).json({
            message: "Order details created successfully",
            data: orderDetails
        });

    } catch (error) {
        next(error);
    }
};

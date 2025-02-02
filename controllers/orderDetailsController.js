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

// Get order details by order ID
export const getOrderDetailsByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        // Authorization check
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

        // Get order details with product information
        const orderDetails = await OrderDetails.findAll({
            where: { orderId },
            include: [{
                model: Product,
                attributes: ["id", "name", "price"]
            }],
            attributes: [
                "id",
                "quantity",
                "unitPrice",
                "subtotal"
            ]
        });

        return res.status(200).json({
            message: "Order details retrieved successfully",
            data: orderDetails
        });

    } catch (error) {
        next(error);
    }
};

// Update order details
export const updateOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, unitPrice } = req.body;

        const orderDetails = await OrderDetails.findByPk(id, {
            include: [{ model: Order }]
        });

        // Authorization check
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: orderDetails.Order.id,
                model: Order
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        // Update with transaction
        const updatedDetails = await sequelize.transaction(async (t) => {
            const subtotal = quantity * unitPrice;
            await orderDetails.update({
                quantity,
                unitPrice,
                subtotal
            }, { transaction: t });

            return OrderDetails.findByPk(id, {
                include: [{
                    model: Product,
                    attributes: ["id", "name", "price"]
                }],
                transaction: t
            });
        });

        return res.status(200).json({
            message: "Order details updated successfully",
            data: updatedDetails
        });

    } catch (error) {
        next(error);
    }
};

// Delete order details
export const deleteOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const orderDetails = await OrderDetails.findByPk(id, {
            include: [{ model: Order }]
        });

        // Authorization check
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: orderDetails.Order.id,
                model: Order
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        await orderDetails.destroy();

        return res.status(200).json({
            message: "Order details deleted successfully",
            data: { id }
        });

    } catch (error) {
        next(error);
    }
};
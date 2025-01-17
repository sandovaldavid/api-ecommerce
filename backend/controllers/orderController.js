import Order from "../models/order.js";
import { Errors } from "../middlewares/errorHandler.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { sequelize } from "../models/index.js";

// Create new order
export const createOrder = async (req, res, next) => {
    try {
        const { userId: requestedUserId, products, total } = req.body;

        // Input validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            throw new Errors.ValidationError("Products array is required", {
                required: ["products"]
            });
        }

        // Validate and get effective user
        const { effectiveUserId } = await AuthorizationService.validateEffectiveUser(
            req,
            requestedUserId
        );

        // Create order with transaction
        const order = await sequelize.transaction(async (t) => {
            const newOrder = await Order.create({
                userId: effectiveUserId,
                total,
                state: "pending",
                created_at: new Date()
            }, { transaction: t });

            // Add products to order
            for (const product of products) {
                await newOrder.addProduct(product.id, {
                    through: {
                        quantity: product.quantity,
                        unitPrice: product.price,
                        subtotal: product.quantity * product.price
                    },
                    transaction: t
                });
            }

            return newOrder;
        });

        return res.status(201).json({
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Get order by ID
export const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: id,
                model: Order,
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        return res.status(200).json({
            message: "Order retrieved successfully",
            data: authResult.resource
        });
    } catch (error) {
        next(error);
    }
};
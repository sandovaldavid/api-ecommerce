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

// Get orders by user ID
export const getOrdersByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "orders",
            {
                userIdResource: userId,
                model: Order
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        const orders = await Order.findAndCountAll({
            where: { userId },
            limit,
            offset,
            order: [["created_at", "DESC"]]
        });

        return res.status(200).json({
            message: "Orders retrieved successfully",
            data: {
                orders: orders.rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(orders.count / limit),
                    totalItems: orders.count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { state } = req.body;

        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: id,
                model: Order
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error);
        }

        await authResult.resource.update({
            state,
            updated_at: new Date()
        });

        return res.status(200).json({
            message: "Order status updated successfully",
            data: authResult.resource
        });
    } catch (error) {
        next(error);
    }
};

// Get order statistics (admin only)
export const getOrderStats = async (req, res, next) => {
    try {
        const stats = await Order.findAll({
            attributes: [
                'state',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total')), 'total']
            ],
            group: ['state']
        });

        return res.status(200).json({
            message: "Order statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
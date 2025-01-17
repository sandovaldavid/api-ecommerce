import Order from "../models/order.js";
import User from "../models/user.js";
import OrderDetails from "../models/orderDetails.js";
import Product from "../models/product.js";
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

        // Input validation
        if (!id) {
            throw new Errors.ValidationError("Order ID is required");
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: id,
                model: Order,
                attributes: [
                    "id",
                    "userId",
                    "total",
                    "state",
                    "created_at",
                    "updated_at"
                ],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                orderId: id,
                userId: req.userId
            });
        }

        // Get order with details using a single query
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: User,
                    attributes: ["id", "firstName", "lastNameFather", "email"]
                },
                {
                    model: OrderDetails,
                    attributes: ["id", "quantity", "unitPrice", "subtotal"],
                    include: [{
                        model: Product,
                        attributes: ["id", "name", "price", "url_img"]
                    }]
                }
            ],
            attributes: [
                "id",
                "total",
                "state",
                "created_at",
                "updated_at"
            ]
        });

        // Format order details for response
        const formattedOrder = {
            id: order.id,
            total: parseFloat(order.total),
            state: order.state,
            created_at: order.created_at,
            updated_at: order.updated_at,
            user: {
                id: order.User.id,
                name: `${order.User.firstName} ${order.User.lastNameFather}`,
                email: order.User.email
            },
            items: order.OrderDetails.map(detail => ({
                id: detail.id,
                product: {
                    id: detail.Product.id,
                    name: detail.Product.name,
                    price: parseFloat(detail.Product.price),
                    url_img: detail.Product.url_img
                },
                quantity: detail.quantity,
                unitPrice: parseFloat(detail.unitPrice),
                subtotal: parseFloat(detail.subtotal)
            }))
        };

        // Set cache headers
        res.set('Cache-Control', 'private, max-age=300');
        res.set('Vary', 'Authorization');

        return res.status(200).json({
            message: "Order retrieved successfully",
            data: {
                order: formattedOrder,
                accessInfo: {
                    isOwner: authResult.isOwner,
                    isAdmin: authResult.isAdmin
                }
            }
        });

    } catch (error) {
        console.error("Error getting order:", {
            error: error.message,
            stack: error.stack,
            orderId: req.params.id,
            userId: req.userId
        });

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

        // Input validation
        if (!id) {
            throw new Errors.ValidationError("Order ID is required");
        }

        if (!state) {
            throw new Errors.ValidationError("Order state is required");
        }

        // Validate state value
        const validStates = ["pending", "sent", "delivered"];
        if (!validStates.includes(state)) {
            throw new Errors.ValidationError("Invalid order state", {
                provided: state,
                validStates
            });
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "order",
            {
                resourceId: id,
                model: Order,
                attributes: [
                    "id",
                    "userId",
                    "total",
                    "state",
                    "created_at"
                ],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                orderId: id,
                userId: req.userId
            });
        }

        // Update order status with transaction
        const updatedOrder = await sequelize.transaction(async (t) => {
            await authResult.resource.update({
                state,
                updated_at: new Date()
            }, { transaction: t });

            // Get updated order with user info
            return Order.findByPk(id, {
                include: [{
                    model: User,
                    attributes: ["id", "firstName", "lastNameFather"]
                }],
                transaction: t
            });
        });

        // Set cache control headers
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');

        return res.status(200).json({
            message: "Order status updated successfully",
            data: {
                order: updatedOrder,
                updatedBy: {
                    userId: req.userId,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error updating order status:", {
            error: error.message,
            stack: error.stack,
            orderId: req.params.id,
            userId: req.userId
        });

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

//Get All Orders (admin only)
export const getAllOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const orders = await Order.findAndCountAll({
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
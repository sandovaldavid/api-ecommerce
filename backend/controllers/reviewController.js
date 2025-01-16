import Review from "../models/review.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { sequelize } from "../models/index.js";

export const createReview = async (req, res) => {
    try {
        const {
            userId,
            productId,
            rating,
            reviewText
        } = req.body;

        // Input validation
        if (!userId || !productId || !rating) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["userId", "productId", "rating"]
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: "Rating must be between 1 and 5"
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            where: {
                userId,
                productId
            }
        });

        if (existingReview) {
            return res.status(400).json({
                error: "User already reviewed this product"
            });
        }

        // Create review
        const review = await Review.create({
            userId,
            productId,
            rating,
            reviewText: reviewText?.trim() || null
        });

        // Get review with user and product data
        const reviewWithDetails = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    attributes: ["id", "firstName", "lastName_father"]
                },
                {
                    model: Product,
                    attributes: ["id", "name", "description"]
                }
            ]
        });

        return res.status(201).json({
            message: "Review created successfully",
            data: reviewWithDetails
        });

    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            error: "Error creating review",
            details: error.message
        });
    }
};

export const getReviews = async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get filters from query params
        const { productId, rating, userId } = req.query;

        // Build where clause
        const whereClause = {};
        if (productId) whereClause.productId = productId;
        if (rating) whereClause.rating = rating;
        if (userId) whereClause.userId = userId;

        // Get total count for pagination
        const totalCount = await Review.count({ where: whereClause });

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No reviews found"
            });
        }

        // Get reviews with pagination and includes
        const reviews = await Review.findAll({
            where: whereClause,
            limit,
            offset,
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: User,
                    attributes: ["id", "firstName", "lastName_father"]
                },
                {
                    model: Product,
                    attributes: ["id", "name", "description"]
                }
            ],
            attributes: [
                "id",
                "rating",
                "reviewText",
                "created_at",
                "updated_at"
            ]
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            message: "Reviews retrieved successfully",
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error("Error getting reviews:", error);
        return res.status(500).json({
            error: "Error retrieving reviews",
            details: error.message
        });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Input validation
        if (!id) {
            return res.status(400).json({
                error: "Review ID is required"
            });
        }

        // Check authorization
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            id,
            'review',
            {
                model: Review,
                attributes: ['id', 'userId', 'rating', 'reviewText', 'created_at'],
                includeUser: true
            }
        );

        if (!authResult.isAuthorized) {
            return res.status(authResult.statusCode).json({
                error: authResult.error,
                details: authResult.details
            });
        }

        // Delete review with transaction
        await sequelize.transaction(async (t) => {
            await authResult.resource.destroy({ transaction: t });

            // Log deletion for audit - Uncomment if needed
            // await sequelize.models.AuditLog.create({
            //     action: 'DELETE_REVIEW',
            //     userId: req.userId,
            //     resourceId: id,
            //     resourceType: 'review',
            //     details: JSON.stringify({
            //         deletedBy: {
            //             userId: req.userId,
            //             isAdmin: authResult.isAdmin
            //         }
            //     })
            // }, { transaction: t });
        });

        return res.status(200).json({
            message: "Review deleted successfully",
            data: {
                reviewId: id,
                deletedBy: {
                    userId: req.userId,
                    isOwner: authResult.isOwner,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error('Error deleting review:', {
            error: error.message,
            stack: error.stack,
            reviewId: req.params.id,
            userId: req.userId
        });

        return res.status(500).json({
            error: "Error deleting review",
            details: error.message
        });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review_text: reviewText } = req.body;

        // Input validation
        if (!id) {
            return res.status(400).json({
                error: "Review ID is required"
            });
        }

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                error: "Rating must be between 1 and 5"
            });
        }

        // Check if review exists with minimal data loading
        const review = await Review.findByPk(id, {
            include: [{
                model: User,
                attributes: ["id", "firstName"]
            }]
        });

        if (!review) {
            return res.status(404).json({
                error: "Review not found"
            });
        }

        // Authorization check
        const userRoles = await req.user.getRoles();
        const isAdminOrMod = userRoles.some(role =>
            ["admin", "moderator"].includes(role.name)
        );

        if (!isAdminOrMod && req.userId !== review.userId) {
            return res.status(403).json({
                error: "Not authorized to update this review"
            });
        }

        // Update review with validation
        const updates = {};
        if (rating) updates.rating = rating;
        if (reviewText !== undefined) updates.review_text = reviewText.trim();
        updates.updated_at = new Date();

        await review.update(updates);

        // Get updated review with related data
        const updatedReview = await Review.findByPk(id, {
            include: [
                {
                    model: User,
                    attributes: ["id", "firstName", "lastName_father"]
                },
                {
                    model: Product,
                    attributes: ["id", "name", "descripcion"]
                }
            ]
        });

        return res.status(200).json({
            message: "Review updated successfully",
            data: updatedReview
        });

    } catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({
            error: "Error updating review",
            details: error.message
        });
    }
};
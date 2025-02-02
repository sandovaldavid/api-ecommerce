import Review from "../models/review.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { sequelize } from "../models/index.js";
import { Errors } from "../middlewares/errorHandler.js";

export const createReview = async (req, res, next) => {
    try {
        const {
            userId: requestedUserId,
            productId,
            rating,
            reviewText
        } = req.body;

        // Input validation
        if (!productId || !rating) {
            throw new Errors.ValidationError("Missing required fields", {
                required: ["productId", "rating"],
                provided: { productId, rating }
            });
        }

        // Validate rating range
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Errors.ValidationError("Invalid rating value", {
                details: "Rating must be an integer between 1 and 5",
                provided: rating
            });
        }

        // Validate and get effective user
        const { effectiveUserId } = await AuthorizationService.validateEffectiveUser(
            req,
            requestedUserId
        );

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            where: {
                userId: effectiveUserId,
                productId
            },
            attributes: ["id", "created_at"]
        });

        if (existingReview) {
            throw new Errors.ValidationError("User already reviewed this product", {
                reviewId: existingReview.id,
                userId: effectiveUserId,
                productId,
                createdAt: existingReview.created_at
            });
        }

        // Create review with transaction
        const reviewWithDetails = await sequelize.transaction(async (t) => {
            // Create the review
            const review = await Review.create({
                userId: effectiveUserId,
                productId,
                rating,
                reviewText: reviewText?.trim() || null,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction: t });

            // Get review with related data
            return Review.findByPk(review.id, {
                include: [
                    {
                        model: User,
                        attributes: ["id", "firstName", "lastNameFather"]
                    },
                    {
                        model: Product,
                        attributes: ["id", "name", "description"]
                    }
                ],
                transaction: t
            });
        });

        // Set cache control headers
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");

        return res.status(201).json({
            message: "Review created successfully",
            data: {
                review: reviewWithDetails,
                createdBy: {
                    userId: req.userId,
                    isAdmin: req.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error creating review:", {
            error: error.message,
            stack: error.stack,
            userId: req.userId,
            productId: req.body.productId
        });

        next(error);
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
                    attributes: ["id", "firstName", "lastNameFather"]
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

export const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Input validation
        if (!id) {
            throw new Errors.ValidationError("Review ID is required");
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "review",
            {
                resourceId: id,
                model: Review,
                attributes: ["id", "userId", "rating", "reviewText", "created_at"],
                includeUser: true,
                userAttributes: ["id", "firstName", "lastNameFather"]
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                reviewId: id,
                userId: req.userId
            });
        }

        // Delete review with transaction
        await sequelize.transaction(async (t) => {
            await authResult.resource.destroy({ transaction: t });

            // Log deletion for audit
            await sequelize.models.AuditLog?.create({
                action: "DELETE_REVIEW",
                userId: req.userId,
                resourceId: id,
                resourceType: "review",
                details: JSON.stringify({
                    deletedBy: {
                        userId: req.userId,
                        isAdmin: authResult.isAdmin
                    }
                })
            }, { transaction: t });
        });

        // Set cache control headers
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");

        return res.status(200).json({
            message: "Review deleted successfully",
            data: {
                reviewId: id,
                product: {
                    id: authResult.resource.Product?.id,
                    name: authResult.resource.Product?.name
                },
                deletedBy: {
                    userId: req.userId,
                    isOwner: authResult.isOwner,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error deleting review:", {
            error: error.message,
            stack: error.stack,
            reviewId: req.params.id,
            userId: req.userId
        });

        next(error);
    }
};

export const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, reviewText } = req.body;

        // Input validation
        if (!id) {
            throw new Errors.ValidationError("Review ID is required");
        }

        // Validate update data
        if (!rating && reviewText === undefined) {
            throw new Errors.ValidationError("At least one field to update is required", {
                updateableFields: ["rating", "reviewText"]
            });
        }

        // Validate rating if provided
        if (rating !== undefined) {
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                throw new Errors.ValidationError("Invalid rating value", {
                    details: "Rating must be an integer between 1 and 5",
                    provided: rating
                });
            }
        }

        // Check authorization using AuthorizationService
        const authResult = await AuthorizationService.verifyResourceOwnership(
            req.userId,
            "review",
            {
                resourceId: id,
                model: Review,
                attributes: ["id", "userId", "rating", "reviewText", "created_at"],
                includeUser: true,
                userAttributes: ["id", "firstName", "lastNameFather"]
            }
        );

        if (!authResult.isAuthorized) {
            throw new Errors.AuthorizationError(authResult.error, {
                reviewId: id,
                userId: req.userId
            });
        }

        // Prepare update data
        const updates = {
            updated_at: new Date()
        };

        if (rating !== undefined) updates.rating = rating;
        if (reviewText !== undefined) updates.reviewText = reviewText.trim();

        // Update review with transaction
        const updatedReview = await sequelize.transaction(async (t) => {
            await authResult.resource.update(updates, { transaction: t });

            // Get updated review with related data
            return Review.findByPk(id, {
                include: [
                    {
                        model: User,
                        attributes: ["id", "firstName", "lastNameFather"],
                        required: true
                    },
                    {
                        model: Product,
                        attributes: ["id", "name", "description"],
                        required: true
                    }
                ],
                transaction: t
            });
        });

        // Set cache control headers
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");

        return res.status(200).json({
            message: "Review updated successfully",
            data: {
                review: updatedReview,
                updatedBy: {
                    userId: req.userId,
                    isOwner: authResult.isOwner,
                    isAdmin: authResult.isAdmin,
                    timestamp: new Date()
                }
            }
        });

    } catch (error) {
        console.error("Error updating review:", {
            error: error.message,
            stack: error.stack,
            reviewId: req.params.id,
            userId: req.userId
        });

        next(error);
    }
};
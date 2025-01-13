import Review from "../models/review.js";
import User from "../models/user.js";
import Product from "../models/product.js";

export const createReview = async (req, res) => {
    try {
        const {
            usuario_id: usuarioId,
            producto_id: productoId,
            rating,
            review_text: reviewText
        } = req.body;

        // Input validation
        if (!usuarioId || !productoId || !rating) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["usuario_id", "producto_id", "rating"]
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
                usuario_id: usuarioId,
                producto_id: productoId
            }
        });

        if (existingReview) {
            return res.status(400).json({
                error: "User already reviewed this product"
            });
        }

        // Create review
        const review = await Review.create({
            usuario_id: usuarioId,
            producto_id: productoId,
            rating,
            review_text: reviewText?.trim() || null
        });

        // Get review with user and product data
        const reviewWithDetails = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName_father']
                },
                {
                    model: Product,
                    attributes: ['id', 'nombre', 'descripcion']
                }
            ]
        });

        return res.status(201).json({
            message: "Review created successfully",
            data: reviewWithDetails
        });

    } catch (error) {
        console.error('Error creating review:', error);
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
        const { producto_id, rating, usuario_id } = req.query;

        // Build where clause
        const whereClause = {};
        if (producto_id) whereClause.producto_id = producto_id;
        if (rating) whereClause.rating = rating;
        if (usuario_id) whereClause.usuario_id = usuario_id;

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
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName_father']
                },
                {
                    model: Product,
                    attributes: ['id', 'nombre', 'description']
                }
            ],
            attributes: [
                'id',
                'rating',
                'review_text',
                'created_at',
                'updated_at'
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
        console.error('Error getting reviews:', error);
        return res.status(500).json({
            error: "Error retrieving reviews",
            details: error.message
        });
    }
};
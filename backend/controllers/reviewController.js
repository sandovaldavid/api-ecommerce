import Review from "../models/review.js";

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

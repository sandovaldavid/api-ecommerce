import Review from "../models/review.js";

export const createReview = async(req, res) => {
  try {
    const { usuario_id: usuarioId, producto_id: productoId, rating, review_text: reviewText } = req.body;
    const review = await Review.create({ usuario_id: usuarioId, producto_id: productoId, rating, review_text: reviewText });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
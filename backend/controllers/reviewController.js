import Review from '../models/review.js';

export const createReview = async (req, res) => {
  try {
    const {usuario_id, producto_id, rating, review_text} = req.body;
    const review = await Review.create({usuario_id, producto_id, rating, review_text});
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

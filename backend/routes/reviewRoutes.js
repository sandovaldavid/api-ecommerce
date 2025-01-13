import express from "express";
import { createReview, getReviews, deleteReview, updateReview } from "../controllers/reviewController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", [authJwt.verifyToken, authJwt.hasRoles("user", "admin", "moderator")], createReview);
router.get("/", getReviews);
router.delete("/:id", authJwt.hasRoles("user", "admin", "moderator"), deleteReview);
router.put("/:id", authJwt.hasRoles("user", "admin", "moderator"), updateReview);
export default router;
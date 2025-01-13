import express from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", [authJwt.verifyToken, authJwt.hasRoles("user", "admin", "moderator")], createReview);
router.get("/", getReviews);

export default router;
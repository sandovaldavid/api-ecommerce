import express from "express";
import { createReview } from "../controllers/reviewController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.post("/", [authJwt.verifyToken, authJwt.hasRoles("user", "admin", "moderator")], createReview);

export default router;
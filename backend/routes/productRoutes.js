import express from "express";
import { getAllProducts, createProduct } from "../controllers/productController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.get("/", getAllProducts);
router.post("/",[authJwt.verifyToken, authJwt.isModerator], createProduct);

export default router;
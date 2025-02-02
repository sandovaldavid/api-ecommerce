import express from "express";
import { getAllProducts, createProduct, getProductById, updateProduct, deleteProduct, searchProducts, updateProductStock, getFeaturedProducts, getProductReviews } from "../controllers/productController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);

router.get("/featured", getFeaturedProducts);
router.get("/search", searchProducts);

router.get("/:id/reviews", getProductReviews);
router.get("/:id", getProductById);
router.put("/:id", authJwt.hasRoles("admin", "moderator"), updateProduct);
router.delete("/:id", authJwt.hasRoles("admin", "moderator"), deleteProduct);
router.patch("/:id/stock", authJwt.hasRoles("admin", "moderator"), updateProductStock);

router.get("/", getAllProducts);
router.post("/", authJwt.hasRoles("admin", "moderator"), createProduct);

export default router;
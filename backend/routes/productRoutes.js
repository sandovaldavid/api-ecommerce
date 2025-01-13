import express from "express";
import { getAllProducts, createProduct, getProductById, updateProduct } from "../controllers/productController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.get("/", getAllProducts);
router.post("/", authJwt.hasRoles("admin", "moderator"), createProduct);
router.get("/:id", getProductById);
router.put("/:id", authJwt.hasRoles("admin", "moderator"), updateProduct);

export default router;
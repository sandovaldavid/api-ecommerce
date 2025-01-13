import express from "express";
import { getAllProducts, createProduct, getProductById } from "../controllers/productController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.get("/", getAllProducts);
router.post("/", authJwt.hasRoles("admin", "moderator"), createProduct);
router.get("/:id", getProductById);

export default router;
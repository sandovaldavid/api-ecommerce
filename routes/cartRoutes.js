import express from "express";
import { createCart, getCartById, deleteCart } from "../controllers/cartController.js";

const router = express.Router();

router.post("/", createCart);           // Crear un nuevo carrito
router.get("/:id", getCartById);        // Obtener un carrito por ID
router.delete("/:id", deleteCart);      // Eliminar un carrito por ID

export default router;
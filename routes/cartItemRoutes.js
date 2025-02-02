import express from "express";
import { addCartItem, updateCartItem, deleteCartItem, getCartItemsByCartId } from "../controllers/cartItemController.js";

const router = express.Router();

router.post("/", addCartItem);           // Añadir un producto al carrito
router.put("/:id", updateCartItem);      // Actualizar la quantity de un producto en el carrito
router.delete("/:id", deleteCartItem);   // Eliminar un producto del carrito
router.get("/:cart_id", getCartItemsByCartId); // Obtener todos los productos de un carrito

export default router;
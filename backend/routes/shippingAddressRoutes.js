import express from "express";
import {
    createShippingAddress,
    getShippingAddressesByUserId,
    getAllShippingAddresses,
    deleteShippingAddress,
    updateShippingAddress
} from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware for all routes
router.use(authJwt.verifyToken);

// User routes
router.get("/user/:usuario_id", [authJwt.isOwnerOrAdmin("usuario_id")], getShippingAddressesByUserId);
router.post("/", [authJwt.isOwnerOrAdmin("usuario_id")], createShippingAddress);
router.put("/:id_ShippingAddress", [authJwt.isOwnerOrAdmin("usuario_id")], updateShippingAddress);
router.delete("/:id_ShipingAddress", [authJwt.isOwnerOrAdmin("usuario_id")], deleteShippingAddress);

// Admin routes
router.get("/", [authJwt.verifyToken, authJwt.hasRoles("admin")], getAllShippingAddresses);

export default router;
import express from "express";
import {
    createShippingAddress,
    getShippingAddressesByUserId,
    getAllShippingAddresses,
    deleteShippingAddress,
    updateShippingAddress,
    getShippingAddressById,
    validateShippingAddress,
    setDefaultAddress,
    bulkDeleteAddresses
} from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware for all routes
router.use(authJwt.verifyToken);

// User routes
router.post("/", authJwt.isOwnerOrAdmin("userId"), createShippingAddress);
router.delete("/bulk", authJwt.isOwnerOrAdmin("userId"), bulkDeleteAddresses);
router.post("/validate", validateShippingAddress);
router.get("/user/:userId", authJwt.isOwnerOrAdmin("userId"), getShippingAddressesByUserId);
router.put("/:IdShippingAddress", authJwt.isOwnerOrAdmin("userId"), updateShippingAddress);
router.delete("/:IdShippingAddress", authJwt.isOwnerOrAdmin("userId"), deleteShippingAddress);
router.get("/:IdShippingAddress", authJwt.isOwnerOrAdmin("userId"), getShippingAddressById);
router.patch("/:IdShippingAddress/default", authJwt.isOwnerOrAdmin("userId"), setDefaultAddress);

// Admin routes
router.get("/", authJwt.hasRoles("admin"), getAllShippingAddresses);

export default router;
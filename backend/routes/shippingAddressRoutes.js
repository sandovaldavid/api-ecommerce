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
router.post("/", createShippingAddress);
router.delete("/bulk", bulkDeleteAddresses);
router.post("/validate", validateShippingAddress);
router.get("/user/:userId", getShippingAddressesByUserId);
router.put("/:IdShippingAddress", updateShippingAddress);
router.delete("/:IdShippingAddress", deleteShippingAddress);
router.get("/:IdShippingAddress", getShippingAddressById);
router.patch("/:IdShippingAddress/default", setDefaultAddress);

// Admin routes
router.get("/", authJwt.hasRoles("admin"), getAllShippingAddresses);

export default router;
import express from "express";
import { createShippingAddress, getShippingAddressesByUserId, getAllShippingAddresses, deleteShippingAddress, updateShippingAddress } from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", createShippingAddress);
router.get("/user/:usuario_id", authJwt.isOwnerOrAdmin("usuario_id"), getShippingAddressesByUserId);
router.delete("/:id_ShipingAddress", authJwt.isOwnerOrAdmin("usuario_id"), deleteShippingAddress);
router.put("/:id_ShipingAddress", authJwt.isOwnerOrAdmin("usuario_id"), updateShippingAddress);

// Admin routes
router.use(authJwt.isAdmin);
router.get("/", getAllShippingAddresses);

export default router;
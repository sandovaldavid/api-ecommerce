import express from "express";
import { createShippingAddress, getShippingAddressesByUserId, getAllShippingAddresses, deleteShippingAddress, updateShippingAddress } from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", createShippingAddress);
router.get("/user/:usuario_id", getShippingAddressesByUserId);
router.get("/", getAllShippingAddresses);
router.delete("/:id_ShipingAddress", deleteShippingAddress);
router.put("/:id_ShipingAddress", authJwt.isOwnerOrAdmin("usuario_id"), updateShippingAddress);

export default router;
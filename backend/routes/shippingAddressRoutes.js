import express from "express";
import { createShippingAddress, getShippingAddressesByUserId, getAllShippingAddresses, deleteShippingAddress } from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", createShippingAddress);
router.get("/:usuario_id", getShippingAddressesByUserId);
router.get("/", getAllShippingAddresses);
router.delete("/:id_ShipingAddress", deleteShippingAddress);

export default router;
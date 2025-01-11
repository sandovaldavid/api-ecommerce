import express from "express";
import { createShippingAddress, getShippingAddressesByUserId , getAllShippingAddresses } from "../controllers/shippingAddressController.js";

const router = express.Router();

router.post("/create/", createShippingAddress);
router.get("/:usuario_id", getShippingAddressesByUserId);
router.get("/", getAllShippingAddresses);

export default router;
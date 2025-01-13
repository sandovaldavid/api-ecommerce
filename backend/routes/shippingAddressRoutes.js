import express from "express";
import { createShippingAddress, getShippingAddressesByUserId, getAllShippingAddresses } from "../controllers/shippingAddressController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", createShippingAddress);
router.get("/:usuario_id", getShippingAddressesByUserId);
router.get("/", getAllShippingAddresses);

export default router;
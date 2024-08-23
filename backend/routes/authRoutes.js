import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifySignUp, authJwt } from "../middlewares/index.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/register", authJwt.isAdmin, [verifySignUp.checkDuplicateEmail, verifySignUp.checkRolesExisted], register);
router.post("/login", login);

export default router;  // Exportar el router como default
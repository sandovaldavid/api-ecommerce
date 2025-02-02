import express from "express";
import { register, login } from "../controllers/authController.js";
import { verifySignUp, authJwt,verifySignIn } from "../middlewares/index.js";

const router = express.Router();

// noinspection JSCheckFunctionSignatures
router.post("/register", [authJwt.verifyToken, authJwt.isAdmin], [verifySignUp.checkNullFields, verifySignUp.checkDuplicateEmail, verifySignUp.checkRolesExisted], register);
router.post("/login",verifySignIn.checkEmailAndPassword, login);

export default router;  // Exportar el router como default
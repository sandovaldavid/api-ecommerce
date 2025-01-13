import express from "express";
import { getUserProfile, updateUserProfile, deleteUser, getAllUsers } from "../controllers/userController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.get("/profile/:id", getUserProfile);        // Obtener el perfil de un usuario por ID
router.put("/profile/:id", updateUserProfile);     // Actualizar el perfil de un usuario
router.delete("/:id", deleteUser);         // Eliminar un usuario por ID
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], getAllUsers); // Obtener todos los usuarios

export default router;
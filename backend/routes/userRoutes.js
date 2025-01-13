import express from "express";
import { getUserProfile, updateUserProfile, deleteUser, getAllUsers } from "../controllers/userController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(authJwt.verifyToken);                    // Middleware para verificar el token de autenticación
router.get("/profile/:id",authJwt.isOwnerOrAdmin("id") ,getUserProfile);         // Obtener el perfil de un usuario por ID
router.put("/profile/:id", authJwt.isOwnerOrAdmin("id"), updateUserProfile);      // Actualizar el perfil de un usuario

// Admin routes (require admin role)
router.use(authJwt.hasRoles("admin"));          // Middleware para verificar el rol de administrador
router.get("/", getAllUsers);                   // Obtener todos los usuarios
router.delete("/:id", deleteUser);              // Eliminar un usuario por ID

export default router;
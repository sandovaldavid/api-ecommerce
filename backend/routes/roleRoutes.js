import express from "express";
import { createRole, getAllRoles, deleteRole, assignRole, removeRole } from "../controllers/roleController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

router.use(authJwt.verifyToken);
router.post("/", createRole);                   // Crear un nuevo rol
router.get("/", authJwt.hasRoles("user", "admin", "moderator"), getAllRoles);                   // Obtener todos los roles
router.delete("/:id", deleteRole);              // Eliminar un rol
router.post("/assign", assignRole);             // Asignar un rol a un usuario
router.post("/remove", removeRole);             // Eliminar un rol de un usuario
export default router;
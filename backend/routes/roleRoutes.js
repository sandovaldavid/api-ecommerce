import express from "express";
import { createRole, getAllRoles, deleteRole, assignRole, removeRole } from "../controllers/roleController.js";

const router = express.Router();

router.post("/", createRole);                   // Crear un nuevo rol
router.get("/", getAllRoles);                   // Obtener todos los roles
router.delete("/:id", deleteRole);              // Eliminar un rol
router.post("/assign", assignRole);             // Asignar un rol a un usuario
router.post("/remove", removeRole);             // Eliminar un rol de un usuario
export default router;
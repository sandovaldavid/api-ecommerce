import express from "express";
import { createRole, getAllRoles,  } from "../controllers/roleController.js";

const router = express.Router();

router.post("/", createRole);                   // Crear un nuevo rol
router.get("/", getAllRoles);                   // Obtener todos los roles

export default router;
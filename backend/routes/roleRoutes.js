import express from "express";
import {
    createRole,
    getAllRoles,
    deleteRole,
    assignRole,
    removeRole
} from "../controllers/roleController.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Base middleware
router.use(authJwt.verifyToken);

// Role management routes
router.post("/", authJwt.isAdmin, createRole);
router.get("/", authJwt.hasRoles("admin", "moderator"), getAllRoles);
router.delete("/:id", authJwt.isAdmin, deleteRole);

// User role management routes
router.put("/users/:userId/roles", authJwt.isAdmin, assignRole);
router.delete("/users/:userId/roles/:roleId", authJwt.isAdmin, removeRole);

export default router;
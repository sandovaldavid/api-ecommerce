import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { User } from "../models/userRoles.js";

export const verifyToken = async (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) return res.status(403).json({ error: "A token is required for authentication" });
    try {
        const decoded = jwt.verify(token, config.development.secret);
        req.userId = decoded.id;
        const user = await User.findByPk(req.userId, { attributes: { exclude: ["hashed_password"] } });
        if (!user) return res.status(404).json({ error: "No user found" });
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const isModerator = async (req, res, next) => {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();
    const hasModeratorRole = roles.some(role => role.name === "moderator");
    if (!hasModeratorRole) return res.status(403).json({ message: "Require Moderator Role" });
    next();
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);
        const roles = await user.getRoles();
        const hasModeratorRole = roles.some(role => role.name === "admin");
        if (!hasModeratorRole) return res.status(403).json({ message: "Require admin Role" });
        next();
    } catch (e){
        return res.status(500).json({ error: e.message });
    }
};

export const hasRoles = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId);
            const userRoles = await user.getRoles();
            const hasRequiredRole = userRoles.some(role => roles.includes(role.name));

            if (!hasRequiredRole) {
                return res.status(403).json({
                    message: `Require one of these roles: ${roles.join(', ')}`
                });
            }
            next();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };
};

export const isOwnerOrAdmin = (paramId) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId);
            const userRoles = await user.getRoles();

            // Verificar si es admin o moderador
            const isAdminOrMod = userRoles.some(role =>
                ["admin", "moderator"].includes(role.name)
            );

            // Verificar si es el propietario
            const isOwner = (req.userId === req.params[paramId]) || (req.body.userId === req.userId);

            if (!isOwner && !isAdminOrMod) {
                return res.status(403).json({
                    message: "Require owner, admin or moderator privileges"
                });
            }

            // Agregar flag para uso en el controlador
            req.isAdmin = userRoles.some(role => role.name === "admin");
            req.isModerator = userRoles.some(role => role.name === "moderator");

            next();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };
};
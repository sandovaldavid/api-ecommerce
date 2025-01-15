import { User } from "../models/userRoles.js";
import { TokenService } from "../services/tokenService.js";
import { UserService } from "../services/userService.js";

export const verifyToken = async (req, res, next) => {
    try {
        // Use TokenService to extract and validate token
        const tokenResult = TokenService.extractFromHeaders(req);
        if (!tokenResult.success) {
            return res.status(401).json({
                error: "No token provided",
                details: tokenResult.error
            });
        }

        // Validate token
        const validationResult = TokenService.validate(tokenResult.token);
        if (!validationResult.isValid) {
            return res.status(401).json({
                error: "Invalid token",
                details: validationResult.error
            });
        }

        // Get user ID from decoded token
        const userId = validationResult.decoded.id;
        if (!userId) {
            return res.status(401).json({
                error: "Invalid token payload",
                details: "User ID not found in token"
            });
        }

        // Use UserService to validate user
        const user = await UserService.findById(userId);
        const validation = UserService.validateUser(user);

        if (!validation.isValid) {
            return res.status(401).json({
                error: "User validation failed",
                details: validation.error
            });
        }

        // Attach user and role info to request
        req.userId = user.id;
        req.user = validation.user;
        req.isAdmin = user.Roles?.some(role => role.name === "admin") || false;
        req.isModerator = user.Roles?.some(role => role.name === "moderator") || false;

        // Cache control headers for security
        res.set("Cache-Control", "no-store");
        res.set("Pragma", "no-cache");

        next();
    } catch (error) {
        console.error("Token verification error:", {
            error: error.message,
            stack: error.stack,
            path: req.path
        });

        return res.status(401).json({
            error: "Authentication failed",
            details: error.message
        });
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
                    message: `Require one of these roles: ${roles.join(", ")}`
                });
            }
            next();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };
};
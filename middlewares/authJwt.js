import { User } from "../models/userRoles.js";
import { TokenService } from "../services/tokenService.js";
import { UserService } from "../services/userService.js";
import { Errors } from "./errorHandler.js";

export const verifyToken = async (req, res, next) => {
    try {
        // Use TokenService to extract and validate token
        const tokenResult = TokenService.extractFromHeaders(req);
        if (!tokenResult.success) {
            throw new Errors.AuthenticationError("Token not found in headers");
        }

        // Validate token
        const validationResult = TokenService.validate(tokenResult.token);
        if (!validationResult.isValid) {
            throw new Errors.AuthenticationError("Invalid token");
        }

        // Get user ID from decoded token
        const userId = validationResult.decoded.id;
        if (!userId) {
            throw new Errors.AuthenticationError("Invalid token payload");
        }

        // Use UserService to validate user
        const user = await UserService.findById(userId);
        const validation = UserService.validateUser(user);

        if (!validation.isValid) {
            throw new Errors.AuthenticationError(validation.error
                ? `User validation failed: ${validation.error}`
                : "User not found");
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
        next(error);
    }
};

export const isModerator = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);
        const roles = await user.getRoles();
        const hasModeratorRole = roles.some(role => role.name === "moderator");
        if (!hasModeratorRole) throw new Errors.AuthorizationError("Require moderator Role");
        next();
    } catch (e){
        next(e);
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);
        const roles = await user.getRoles();
        const hasModeratorRole = roles.some(role => role.name === "admin");
        if (!hasModeratorRole) throw new Errors.AuthorizationError("Require admin Role");
        next();
    } catch (e){
        next(e);
    }
};

export const hasRoles = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId);
            const userRoles = await user.getRoles();
            const hasRequiredRole = userRoles.some(role => roles.includes(role.name));

            if (!hasRequiredRole) {
                throw new Errors.AuthorizationError("Require roles: " + roles.join(", "));
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
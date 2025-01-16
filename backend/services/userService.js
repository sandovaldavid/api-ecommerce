import { User } from "../models/userRoles.js";
import { Roles } from "../models/userRoles.js";

export class UserService {
    static async findById (userId) {
        try {
            return await User.findByPk(userId, {
                attributes: {
                    exclude: ["hashedPassword", "created_at", "updated_at"]
                },
                include: [{
                    model: Roles,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                }]
            });
        } catch (error) {
            console.error("Error finding user:", {
                error: error.message,
                stack: error.stack,
                userId
            });
            throw error;
        }
    }

    static validateUser (user) {
        try {
            if (!user) {
                return {
                    isValid: false,
                    error: "User not found"
                };
            }

            // Validate user status
            if (!user.isActive) {
                return {
                    isValid: false,
                    error: "User account is inactive"
                };
            }

            return {
                isValid: true,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastNameFather: user.lastNameFather,
                    email: user.email,
                    roles: user.Roles?.map(role => role.name) || []
                }
            };
        } catch (error) {
            console.error("User validation error:", {
                error: error.message,
                stack: error.stack,
                userId: user?.id
            });

            return {
                isValid: false,
                error: error.message
            };
        }
    }

    static async hasRole (userId, roleName) {
        try {
            const user = await this.findById(userId);
            if (!user) return false;

            return user.Roles.some(role => role.name === roleName);
        } catch (error) {
            console.error("Role check error:", {
                error: error.message,
                stack: error.stack,
                userId,
                roleName
            });
            return false;
        }
    }

    static async hasRoles (userId, roles) {
        try {
            const user = await this.findById(userId);
            if (!user) return false;

            return user.Roles.some(role => roles.includes(role.name));
        } catch (error) {
            console.error("Roles check error:", {
                error: error.message,
                stack: error.stack,
                userId,
                roles
            });
            return false;
        }
    }
}
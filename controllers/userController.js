import { User, Roles } from "../models/userRoles.js";
import bcrypt from "bcryptjs";
import { Errors } from "../middlewares/errorHandler.js";
import { sequelize } from "../models/index.js";

export const getUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashedPassword", "updated_at", "last_login_at"],
            },
            include: [{
                model: Roles,
                attributes: ["name"],
                through: { attributes: [] }
            }]
        });
        if (!user) {
            throw new Errors.NotFoundError("User not found");
        }
        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                secondName: user.secondName,
                lastNameFather: user.lastNameFather,
                lastNameMother: user.lastNameMother,
                email: user.email,
                roles: user.Roles.map(role => role.name)
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const id = req.userId;
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashedPassword", "updated_at", "last_login_at"],
            },
            include: [{
                model: Roles,
                attributes: ["name"],
                through: { attributes: [] }
            }]
        });
        if (!user) {
            throw new Errors.NotFoundError("User not found");
        }
        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                secondName: user.secondName,
                lastNameFather: user.lastNameFather,
                lastNameMother: user.lastNameMother,
                email: user.email,
                roles: user.Roles.map(role => role.name)
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            secondName,
            lastNameFather,
            lastNameMother,
            email,
            password
        } = req.body;

        // Input validation
        if (!id) {
            throw new Errors.ValidationError("User ID is required");
        }

        // Validate at least one field to update
        if (!firstName && !secondName && !lastNameFather &&
            !lastNameMother && !email && !password) {
            throw new Errors.ValidationError("At least one field to update is required", {
                updateableFields: [
                    "firstName",
                    "secondName",
                    "lastNameFather",
                    "lastNameMother",
                    "email",
                    "password"
                ]
            });
        }

        // Email validation if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                throw new Errors.ValidationError("Invalid email format", {
                    field: "email",
                    provided: email
                });
            }
        }

        // Find user with roles
        const user = await User.findByPk(id, {
            include: [{
                model: Roles,
                attributes: ["name"],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            throw new Errors.NotFoundError("User not found", { userId: id });
        }

        // Prepare updates
        const updates = {
            updated_at: new Date()
        };

        if (firstName) updates.firstName = firstName.trim();
        if (secondName) updates.secondName = secondName.trim();
        if (lastNameFather) updates.lastNameFather = lastNameFather.trim();
        if (lastNameMother) updates.lastNameMother = lastNameMother.trim();
        if (email) updates.email = email.toLowerCase().trim();

        // Handle password update separately
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.hashedPassword = await bcrypt.hash(password, salt);
        }

        // Update user with transaction
        const updatedUser = await sequelize.transaction(async (t) => {
            await user.update(updates, { transaction: t });

            return User.findByPk(id, {
                attributes: [
                    "id",
                    "firstName",
                    "secondName",
                    "lastNameFather",
                    "lastNameMother",
                    "email",
                    "isActive"
                ],
                include: [{
                    model: Roles,
                    attributes: ["name"],
                    through: { attributes: [] }
                }],
                transaction: t
            });
        });

        // Set cache control headers
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");

        return res.status(200).json({
            message: "User profile updated successfully",
            data: {
                user: {
                    id: updatedUser.id,
                    firstName: updatedUser.firstName,
                    secondName: updatedUser.secondName,
                    lastNameFather: updatedUser.lastNameFather,
                    lastNameMother: updatedUser.lastNameMother,
                    email: updatedUser.email,
                    roles: updatedUser.Roles.map(role => role.name)
                },
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Error updating user profile:", {
            error: error.message,
            stack: error.stack,
            userId: req.params.id
        });

        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashedPassword", "updated_at", "last_login_at"],
            },
        });
        if (!user) {
            throw new Errors.NotFoundError("User not found");
        }
        await user.destroy();
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["hashedPassword"] },
        });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};
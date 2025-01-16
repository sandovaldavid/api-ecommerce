import { User, Roles } from "../models/userRoles.js";
import bcrypt from "bcryptjs";
import { Errors } from "../middlewares/errorHandler.js";

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

export const updateUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, email, password } = req.body;
    
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashedPassword", "updated_at", "last_login_at"],
            },
        });
        if (!user) {
            throw new Errors.NotFoundError("User not found");
        }
    
        if (nombre) user.name = nombre;
        if (email) user.email = email;
    
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.hashedPassword = await bcrypt.hash(password, salt);
        }
    
        await user.save();
        res.status(200).json(user);
    } catch (error) {
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
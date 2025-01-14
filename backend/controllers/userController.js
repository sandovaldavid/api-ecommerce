import { User, Roles } from "../models/userRoles.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashed_password", "updated_at", "last_login_at"],
            },
            include: [{
                model: Roles,
                attributes: ['name'],
                through: { attributes: [] }
            }]
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                secondName: user.secondName,
                lastName_father: user.lastName_father,
                lastName_mother: user.lastName_mother,
                email: user.email,
                roles: user.Roles.map(role => role.name)
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password } = req.body;
    
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashed_password", "updated_at", "last_login_at"],
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
    
        if (nombre) user.name = nombre;
        if (email) user.email = email;
    
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.hashed_password = await bcrypt.hash(password, salt);
        }
    
        await user.save();
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["hashed_password", "updated_at", "last_login_at"],
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await user.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["hashed_password"] },
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

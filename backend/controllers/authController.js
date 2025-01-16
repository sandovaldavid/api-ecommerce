import jwt from "jsonwebtoken";
import { User, Roles } from "../models/userRoles.js";
import config from "../config/config.js";

// En authController.js
export const register = async (req, res) => {
    try {
        const {
            firstName,
            secondName,
            lastName_father: lastNameFather,
            lastName_mother: lastNameMother,
            email,
            password,
            roles
        } = req.body;

        // Crear el usuario
        const newUser = await User.create({
            firstName,
            secondName,
            lastName_father: lastNameFather,
            lastName_mother: lastNameMother,
            email,
            hashed_password: password
        });

        // Buscar los roles por name y obtener sus IDs
        if (roles && roles.length > 0) {
            const foundRoles = await Roles.findAll({
                where: { name: roles }
            });
            await newUser.setRoles(foundRoles);
        } else {
            // Asignar rol por defecto (user)
            const defaultRole = await Roles.findOne({
                where: { name: "user" }
            });
            await newUser.setRoles([defaultRole]);
        }

        // Generar el token JWT
        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Metodo de inicio de sesión
export const login = async (req, res) => {
    const userId = req.body.userId;
    
    try {
        // Buscar el usuario con sus roles, excluyendo la contraseña
        const user = await User.findByPk(userId, {
            attributes: {
                exclude: ["hashed_password"]
            },
            include: [{
                model: Roles,
                attributes: ["name"],
                through: { attributes: [] }
            }]
        });

        user.setAttributes({
            last_login_at: new Date()
        });

        user.save();
        
        // Generar el token JWT
        const token = jwt.sign({ id: userId }, config.development.secret, { expiresIn: "1h" });

        // Devolver el token y la información del usuario
        res.status(200).json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                secondName: user.secondName,
                lastName_father: user.lastName_father,
                lastName_mother: user.lastName_mother,
                email: user.email,
                roles: user.Roles.map(role => role.name)
            },
            expiresIn: 3600 // 1 hora en segundos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
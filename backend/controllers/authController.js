import { User, Roles } from "../models/userRoles.js";
import { TokenService } from "../services/tokenService.js";
import { Errors } from "../middlewares/errorHandler.js";

// En authController.js
export const register = async (req, res, next) => {
    try {
        const {
            firstName,
            secondName,
            lastNameFather,
            lastNameMother,
            email,
            password,
            roles
        } = req.body;

        // Crear el usuario
        const newUser = await User.create({
            firstName,
            secondName,
            lastNameFather,
            lastNameMother,
            email,
            hashedPassword: password
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
        const token = TokenService.generate(newUser.id, 3600);

        res.status(201).json({
            token: {
                value: token.value,
                expirationDate: token.expirationDate
            },
        });
    } catch (error) {
        next(error);
    }
};

// Metodo de inicio de sesión
export const login = async (req, res) => {
    const userId = req.body.userId;
    
    try {
        // Buscar el usuario con sus roles, excluyendo la contraseña
        const user = await User.findByPk(userId, {
            attributes: {
                exclude: ["hashedPassword"]
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
        const token = TokenService.generate(user.id, 3600);

        // Devolver el token y la información del usuario
        res.status(200).json({
            token: {
                value: token.value,
                expires: token.expirationDate
            },
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
import { User, Roles } from "../models/userRoles.js";
import { Errors } from "../middlewares/errorHandler.js";

export const checkDuplicateEmail = async (req, res, next) => {
    try {
        const email = req.body.email;
        const existingUser = await User.findOne({
            where: {
                email
            }
        });
        if (existingUser) {
            throw new Errors.ValidationError({
                message: "Email already in use",
                email
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const checkRolesExisted = async (req, res, next) => {
    try {
        const { roles } = req.body;

        if (roles && Array.isArray(roles)) {
            const rolePromises = roles.map(roleName =>
                Roles.findOne({
                    where: { name: roleName },
                    attributes: ["id", "name"]
                })
            );

            const foundRoles = await Promise.all(rolePromises);

            const missingRoles = roles.filter((roleName, index) => !foundRoles[index]);

            if (missingRoles.length > 0) {
                throw new Errors.ValidationError({
                    message: "Some roles do not exist",
                    invalidRoles: missingRoles
                });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkNullFields = async (req, res, next) => {
    try {
        const { firstName, lastNameFather, lastNameMother, email, password } = req.body;

        if (!firstName || !lastNameFather || !lastNameMother || !email || !password) {
            throw new Errors.ValidationError({
                message: "Missing required fields",
                missing: ["firstName", "lastNameFather", "lastNameFather", "email", "password"]
                    .filter(field => !req.body[field])
            });
        }
        next();
    } catch (error){
        next(error);
    }
};
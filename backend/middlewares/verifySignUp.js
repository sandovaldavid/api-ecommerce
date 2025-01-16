import { User, Roles } from "../models/userRoles.js";

export const checkDuplicateEmail = async (req, res, next) => {
    const email = req.body.email;
    const existingUser = await User.findOne({
        where: {
            email
        }
    });
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }
    next();
};

export const checkRolesExisted = async (req, res, next) => {
    const roles = req.body.roles;
    if (roles) {
        const foundRoles = await Roles.findAll({
            where: {
                name: roles
            }
        });
        if (!foundRoles) {
            return res.status(400).json({ error: "Role does not exist" });
        }
    } else {
        const defaultRole = await Roles.findOne({
            where: {
                name: "user"
            }
        });
        req.body.roles = [defaultRole.id];
    }
    next();
};

export const checkNullFields = async (req, res, next) => {
    const { firstName, lastNameFather, lastNameMother, email, password } = req.body;

    if (!firstName || !lastNameFather || !lastNameMother || !email || !password) {
        throw new Errors.ValidationError({
            message: "Missing required fields",
            missing: ["firstName", "lastNameFather", "lastNameFather", "email", "password"]
                .filter(field => !req.body[field])
        });
    }
    next();
}
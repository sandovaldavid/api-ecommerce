import { User } from "../models/userRoles.js";
import { Errors } from "../middlewares/errorHandler.js";

export const checkEmailAndPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Errors.ValidationError({
                missing: ["email", "password"].filter(field => !req.body[field])
            });
        }

        const user = await User.findOne({
            where: { email },
            attributes: ["id", "email", "hashedPassword", "isActive"]
        });

        if (!user) {
            throw new Errors.AuthenticationError("Invalid credentials");
        }

        const isPasswordValid = await user.comparePassword(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.body.userId = user.id;
        next();
    } catch (error) {
        next(error);
    }
};
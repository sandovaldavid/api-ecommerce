import { User } from "../models/userRoles.js";

export const checkEmailAndPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await user.comparePassword(password, user.hashed_password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.body.userId = user.id;
        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
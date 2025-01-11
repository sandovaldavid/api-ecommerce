import { User } from "../models/userRoles.js";

export const checkEmailAndPassword = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    const isPasswordValid = await user.comparePassword(password, user.hashed_password);
    req.body.userId = user.id;
  
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
  
    if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    next();
};
import jwt from "jsonwebtoken";
import { User } from "../models/userRoles.js";
import config from "../config/config.js";

//TODO: Implementar el método de registro de comentarios
// Método de registro de Comentarios
export const register = async (req, res) => {
  try {
    const {
      firstName,
      secondName,
      lastName_father: lastNameFather,
      lastName_mother: lastNameMother,
      email,
      password,
    } = req.body;
    
    // Crear el usuario con la contraseña encriptada
    const newUser = await User.create({
      firstName,
      secondName,
      lastName_father: lastNameFather,
      lastName_mother: lastNameMother,
      email,
      hashed_password: password
    });
    await newUser.addRole(req.body.roles);
    
    // Generar el token JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Devolver el token
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Metodo de inicio de sesión
export const login = async (req, res) => {
  const userId = req.body.userId;
  try {
    // Generar el token JWT
    const token = jwt.sign({ id: userId }, config.development.secret, { expiresIn: "1h" });
    
    // Devolver el token
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
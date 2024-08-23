import jwt from "jsonwebtoken";
import { Roles, User } from "../models/userRoles.js";
import config from "../config/config.js";

// Metodo de registro de Comentarios
export const register = async(req, res) => {
  try {
    const { firstName, secondName, lastName_father: lastNameFather, lastName_mother: lastNameMother, email, password, roles } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    // Crear el usuario con la contraseña encriptada
    const newUser = await User.create({
      firstName,
      secondName,
      lastName_father: lastNameFather,
      lastName_mother: lastNameMother,
      email,
      hashed_password: password
    });
    
    // Verificación de roles
    if (roles) {
      // Buscar los roles que coinciden con los nombres proporcionados en el array `roles`
      const foundRoles = await Roles.findAll({
        where: {
          name: roles // Esto equivale a `$in` en MongoDB
        }
      });
      
      // Asociar los roles encontrados al usuario usando la tabla intermedia
      await newUser.addRole(foundRoles);
      /*addRoles es un metodo generado por Sequelize para la tabla intermedia muchos a muchos*/
    } else {
      // Si no se especifican roles, asignar el rol predeterminado "user"
      const defaultRole = await Roles.findOne({
        where: {
          name: "user"
        }
      });
      
      // Asociar el rol predeterminado al usuario usando la tabla intermedia
      await newUser.addRole(defaultRole); /*addRoles es un metodo generado por Sequelize */
    }
    
    // Generar el token JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Devolver el token
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Metodo de inicio de sesión
export const login = async(req, res) => {
  try {
    const { email, password } = req.body;
    // Buscar al usuario por correo electrónico
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Verificar la contraseña usando bcrypt
    const isPasswordValid = await user.comparePassword(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Generar el token JWT
    const token = jwt.sign({ id: user.id }, config.development.secret, { expiresIn: "1h" });
    
    // Devolver el token
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
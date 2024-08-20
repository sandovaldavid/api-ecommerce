import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Método para el registro de usuarios
export const register = async (req, res) => {
  try {
    const {nombre, email, password} = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({where: {email}});
    if (existingUser) {
      return res.status(400).json({error: 'User already exists'});
    }
    //TODO: Mover la encriptacion de la contraseña al modelo User.js
    //*************************************************************
    // Encriptar la contraseña usando bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //*************************************************************
    // Crear el usuario con la contraseña encriptada
    const newUser = await User.create({
      nombre,
      email,
      hashed_password: hashedPassword
    });
    
    // Generar el token JWT
    const token = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    
    // Devolver el token
    res.status(201).json({token});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

// Método para el inicio de sesión
export const login = async (req, res) => {
  try {
    const {email, password} = req.body;
    // Buscar al usuario por correo electrónico
    const user = await User.findOne({where: {email}});
    if (!user) {
      return res.status(401).json({error: 'Invalid email or password'});
    }
    
    // Verificar la contraseña usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({error: 'Invalid email or password'});
    }
    
    // Generar el token JWT
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    
    // Devolver el token
    res.status(200).json({token});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

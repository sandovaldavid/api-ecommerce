import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
    const {id} = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const createUser = async (req, res) => {
  try {
    const {nombre, email, password} = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({where: {email}});
    if (existingUser) {
      return res.status(400).json({error: 'User already exists with this email'});
    }
    
    // Crear nuevo usuario con la contraseña encriptada
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      nombre,
      email,
      hashed_password: hashedPassword,
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const {id} = req.params;
    const {nombre, email, password} = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    
    if (nombre) user.nombre = nombre;
    if (email) user.email = email;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.hashed_password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const deleteUser = async (req, res) => {
  try {
    const {id} = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const {id} = req.params;
    const user = await User.findAll();
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

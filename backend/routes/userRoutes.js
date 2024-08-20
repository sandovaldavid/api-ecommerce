import express from 'express';
import {getUserProfile, updateUserProfile, deleteUser, getAllUsers} from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', getUserProfile);        // Obtener el perfil de un usuario por ID // Crear un nuevo usuario
router.put('/:id', updateUserProfile);     // Actualizar el perfil de un usuario
router.delete('/:id', deleteUser);         // Eliminar un usuario por ID
router.get('/', getAllUsers);              // Obtener todos los usuarios

export default router;

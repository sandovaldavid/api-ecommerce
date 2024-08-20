import {DataTypes} from 'sequelize';
import {sequelize} from './index.js';
import bcrypt from 'bcryptjs';
import uid2 from 'uid2';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  hashed_password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('cliente', 'administrador'),
    defaultValue: 'cliente',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  hooks: {
    // Hook para encriptar la contraseña antes de crear un usuario
    beforeCreate: async (user) => {
      // Generar un UID único para el campo ID
      user.id = uid2(32);  // Genera un UID de 32 caracteres
    }
  }
});

// Método para verificar la contraseña
User.prototype.checkPassword = function (password) {
  return bcrypt.compare(password, this.hashed_password);  // Comparar la contraseña proporcionada con la encriptada
};

export default User;


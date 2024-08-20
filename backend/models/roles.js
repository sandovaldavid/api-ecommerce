import {DataTypes} from 'sequelize';
import {sequelize} from './index.js';
import uid2 from 'uid2';

const Roles = sequelize.define('Roles', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
}, {
  hooks: {
    // Hook para añadir un UID único antes de crear un usuario
    beforeCreate: async (role) => {
      // Generar un UID único para el campo ID
      role.id = uid2(32);  // Genera un UID de 32 caracteres
    }
  }
});

export default Roles;

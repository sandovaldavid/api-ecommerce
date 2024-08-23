import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import uid2 from "uid2";

const Category = sequelize.define("Category", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
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
    // Hook para añadir un UID único antes de crear un usuario
    beforeCreate: async(user) => {
      // Generar un UID único para el campo ID
      user.id = uid2(32);  // Genera un UID de 32 caracteres
    }
  }
});

export default Category;
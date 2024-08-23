import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import uid2 from "uid2";
import bcrypt from "bcryptjs";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  secondName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName_father: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName_mother: {
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
      // Encriptar la contraseña usando bcrypt
      const salt = await bcrypt.genSalt(10);
      user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
    }
  }
});

User.prototype.comparePassword = async function(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error al comparar la contraseña:", error);
    throw new Error("Error en la comparación de contraseñas");
  }
};

export default User;
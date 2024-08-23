import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import User from "./user.js";
import uid2 from "uid2";

const ShippingAddress = sequelize.define("ShippingAddress", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ciudad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estado_provincia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codigo_postal: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pais: {
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
    beforeCreate: async (user) => {
      // Generar un UID único para el campo ID
      user.id = uid2(32);  // Genera un UID de 32 caracteres
    }
  }
});

ShippingAddress.belongsTo(User, { foreignKey: "usuario_id" });

export default ShippingAddress;
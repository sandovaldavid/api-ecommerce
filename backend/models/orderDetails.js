import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import Order from "./order.js";
import Product from "./product.js";
import uid2 from "uid2";

const OrderDetails = sequelize.define("OrderDetails", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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

OrderDetails.belongsTo(Order, { foreignKey: "orden_id" });
OrderDetails.belongsTo(Product, { foreignKey: "producto_id" });

export default OrderDetails;
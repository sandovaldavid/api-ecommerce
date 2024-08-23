import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import Cart from "./cart.js";
import Product from "./product.js";
import uid2 from "uid2";

const CartItem = sequelize.define("CartItems", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
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

CartItem.belongsTo(Cart, { foreignKey: "cart_id" });
CartItem.belongsTo(Product, { foreignKey: "product_id" });

export default CartItem;
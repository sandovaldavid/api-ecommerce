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
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    timestamps: false,
    hooks: {
        beforeCreate: async (user) => {
            user.id = uid2(32);
        }
    }
});

CartItem.belongsTo(Cart, { foreignKey: "cartId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

export default CartItem;
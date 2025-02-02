import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import User from "./user.js";
import Product from "./product.js";
import uid2 from "uid2";

const Cart = sequelize.define("Carts", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
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
        beforeCreate: async (user) => {
            user.id = uid2(32);
        }
    }
});

Cart.belongsTo(User, { foreignKey: "userId" });
Cart.belongsToMany(Product, { through: "CartItems" });

export default Cart;
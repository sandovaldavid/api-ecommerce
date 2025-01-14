import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import User from "./user.js";
import uid2 from "uid2";

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    state: {
        type: DataTypes.ENUM("pending", "sent", "delivered"),
        defaultValue: "pending",
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

Order.belongsTo(User, { foreignKey: "usuario_id" });

export default Order;
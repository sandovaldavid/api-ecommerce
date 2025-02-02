import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import Order from "./order.js";
import uid2 from "uid2";

const Payment = sequelize.define("Payment", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    payment_method: {
        type: DataTypes.ENUM("creditCard", "paypal"),
        allowNull: false,
    },
    payment_status: {
        type: DataTypes.ENUM("paid", "pending"),
        defaultValue: "pending",
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
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
        beforeCreate: async (user) => {
            user.id = uid2(32);
        }
    }
});

Payment.belongsTo(Order, { foreignKey: "orderId" });

export default Payment;
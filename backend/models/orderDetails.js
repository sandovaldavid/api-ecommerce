import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import uid2 from "uid2";

const OrderDetails = sequelize.define("OrderDetails", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    unitPrice: {
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
        beforeCreate: async (orderDetail) => {
            orderDetail.id = uid2(32);
        }
    }
});

export default OrderDetails;
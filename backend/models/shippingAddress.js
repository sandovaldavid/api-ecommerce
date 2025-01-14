import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import User from "./user.js";
import uid2 from "uid2";

const ShippingAddress = sequelize.define("ShippingAddress", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stateProvince: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    zipCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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

ShippingAddress.belongsTo(User, { foreignKey: "userId" });

export default ShippingAddress;
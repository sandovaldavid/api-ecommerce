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
    lastNameFather: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastNameMother: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    hashedPassword: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: false,
    hooks: {
        beforeCreate: async (user) => {
            user.id = uid2(32);
            const salt = await bcrypt.genSalt(10);
            user.hashedPassword = await bcrypt.hash(user.hashedPassword, salt);
        }
    }
});

User.prototype.comparePassword = async function (password, hashedPassword) {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error("Error to compare password");
    }
};

export default User;
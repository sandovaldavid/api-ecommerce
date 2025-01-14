import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import uid2 from "uid2";

const Roles = sequelize.define("Roles", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    timestamps: false,
    hooks: {
        beforeCreate: async (role) => {
            role.id = uid2(32);
        }
    }
});

const defaultRoles = [
    { id: uid2(32), name: "admin" },
    { id: uid2(32), name: "user" },
    { id: uid2(32), name: "moderator" },
];

Roles.afterSync(async () => {
    try {
        for (const role of defaultRoles) {
            const existingRole = await Roles.findOne({ where: { name: role.name } });
            if (!existingRole) {
                await Roles.create(role);
            }
        }
    } catch (error) {
        console.error("Error to verify default roles:", error);
    }
});

export default Roles;
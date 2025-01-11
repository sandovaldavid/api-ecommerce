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
        unique: true,  // Asegúrate de que los nombres de los roles sean únicos
    },
}, {
    timestamps: false,
});

const defaultRoles = [
    { id: uid2(32), name: "admin" },
    { id: uid2(32), name: "user" },
    { id: uid2(32), name: "moderator" },
];

// Hook para crear roles predeterminados si no existen
Roles.afterSync(async () => {
    try {
        for (const role of defaultRoles) {
            // Verifica si el rol ya existe en la base de datos
            const existingRole = await Roles.findOne({ where: { name: role.name } });
            if (!existingRole) {
                // Si el rol no existe, lo creamos
                await Roles.create(role);
            }
        }
        console.log("Roles predeterminados verificados y creados.");
    } catch (error) {
        console.error("Error al verificar o crear roles predeterminados:", error);
    }
});
export default Roles;
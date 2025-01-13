import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import uid2 from "uid2";  // Importa sequelize desde index.js
import Category from "./category.js";

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    url_img: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    // Hook para añadir un UID único antes de crear un usuario
        beforeCreate: async (user) => {
            // Generar un UID único para el campo ID
            user.id = uid2(32);  // Genera un UID de 32 caracteres
        }
    }
});

Product.belongsTo(Category, { foreignKey: "categoria_id" });

export default Product;
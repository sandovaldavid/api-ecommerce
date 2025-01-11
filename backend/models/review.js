import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import User from "./user.js";
import Product from "./product.js";
import uid2 from "uid2";

const Review = sequelize.define("Review", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    review_text: {
        type: DataTypes.TEXT,
        allowNull: true,
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

Review.belongsTo(User, { foreignKey: "usuario_id" });
Review.belongsTo(Product, { foreignKey: "producto_id" });

export default Review;
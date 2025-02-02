import { sequelize } from "../models/index.js";
import { User, Roles } from "../models/userRoles.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Order from "../models/order.js";
import OrderDetails from "../models/orderDetails.js";
import Payment from "../models/payment.js";
import Review from "../models/review.js";
import ShippingAddress from "../models/shippingAddress.js";
import Cart from "../models/cart.js";
import CartItems from "../models/cartItems.js";

const deleteAllData = async () => {
    try {
        console.log("Iniciando borrado de datos...");

        // Deshabilitar verificación de foreign keys temporalmente
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Borrar datos en orden específico
        await CartItems.destroy({ truncate: true, force: true });
        await Cart.destroy({ truncate: true, force: true });
        await Review.destroy({ truncate: true, force: true });
        await Payment.destroy({ truncate: true, force: true });
        await OrderDetails.destroy({ truncate: true, force: true });
        await Order.destroy({ truncate: true, force: true });
        await ShippingAddress.destroy({ truncate: true, force: true });
        await Product.destroy({ truncate: true, force: true });
        await Category.destroy({ truncate: true, force: true });

        // Eliminar la tabla intermedia UserRoles
        await sequelize.query("TRUNCATE TABLE UserRoles");

        await User.destroy({ truncate: true, force: true });
        await Roles.destroy({ truncate: true, force: true });

        // Reactivar verificación de foreign keys
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("Datos borrados exitosamente");
    } catch (error) {
        console.error("Error al borrar datos:", error);
    } finally {
        process.exit();
    }
};

deleteAllData();
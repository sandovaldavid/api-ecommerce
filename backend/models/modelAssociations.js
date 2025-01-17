import Order from "./order.js";
import OrderDetails from "./orderDetails.js";
import Product from "./product.js";
import User from "./user.js";

export const setupAssociations = () => {
    // Order associations
    Order.belongsTo(User, { foreignKey: "userId" });
    Order.hasMany(OrderDetails, { foreignKey: "orderId" });

    // OrderDetails associations
    OrderDetails.belongsTo(Order, { foreignKey: "orderId" });
    OrderDetails.belongsTo(Product, { foreignKey: "productId" });

    // Product associations
    Product.hasMany(OrderDetails, { foreignKey: "productId" });
};
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {sequelize} from "./models/index.js"
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import orderDetailsRoutes from './routes/orderDetailsRoutes.js';
import shippingAddressRoutes from './routes/shippingAddressRoutes.js';
import cartItemRoutes from './routes/cartItemRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import authRoutes from "./routes/authRoutes.js";
/*import "./models/user.js";
import "./models/product.js";
import "./models/category.js";
import "./models/order.js";
import "./models/payment.js";
import "./models/review.js";
import "./models/carts.js";
import "./models/orderDetails.js";
import "./models/shippingAddress.js";
import "./models/cartItems.js";*/


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/order-details', orderDetailsRoutes);
app.use('/api/shipping-addresses', shippingAddressRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
await sequelize.sync({force: false});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


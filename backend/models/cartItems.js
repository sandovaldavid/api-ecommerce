import { DataTypes } from 'sequelize';
import {sequelize} from './index.js';
import Carts from './carts.js';
import Product from './product.js';

const CartItem = sequelize.define('CartItems', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: false,
});

CartItem.belongsTo(Carts, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

export default CartItem;

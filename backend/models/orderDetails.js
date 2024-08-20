import {DataTypes} from 'sequelize';
import {sequelize} from './index.js';
import Order from './order.js';
import Product from './product.js';

const OrderDetails = sequelize.define('OrderDetails', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  timestamps: false,
});

OrderDetails.belongsTo(Order, {foreignKey: 'orden_id'});
OrderDetails.belongsTo(Product, {foreignKey: 'producto_id'});

export default OrderDetails;

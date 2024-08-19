const {DataTypes} = require('sequelize');
const sequelize = require('./index');
const User = require('./user');
const Product = require('./product');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'enviado', 'entregado'),
    defaultValue: 'pendiente',
  },
});

Order.belongsTo(User);
Order.belongsToMany(Product, {through: 'OrderProducts'});

module.exports = Order;

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
});

Order.belongsTo(User, {foreignKey: 'usuario_id'});
Order.belongsToMany(Product, {through: 'OrderProducts'});

module.exports = Order;

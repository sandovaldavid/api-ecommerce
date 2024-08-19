const {DataTypes} = require('sequelize');
const sequelize = require('./index');
const User = require('./user');
const Product = require('./product');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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

Cart.belongsTo(User, {foreignKey: 'usuario_id'});
Cart.belongsToMany(Product, {through: 'CartItems'});

module.exports = Cart;

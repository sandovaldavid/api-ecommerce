const {Sequelize} = require('sequelize');
const config = require('../config/config');
const User = require('./user');
const Product = require('./product');
const Category = require('./category');
const Order = require('./order');
const Cart = require('./cart');
const Payment = require('./payment');
const Review = require('./review');

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
  }
);

// Definir relaciones
Product.belongsTo(Category, {foreignKey: 'categoria_id'});
Category.hasMany(Product, {foreignKey: 'categoria_id'});

Order.belongsTo(User, {foreignKey: 'usuario_id'});
Order.belongsToMany(Product, {through: 'OrderProducts'});

Cart.belongsTo(User, {foreignKey: 'usuario_id'});
Cart.belongsToMany(Product, {through: 'CartItems'});

Review.belongsTo(User, {foreignKey: 'usuario_id'});
Review.belongsTo(Product, {foreignKey: 'producto_id'});

Payment.belongsTo(Order, {foreignKey: 'orden_id'});

// Sincronizar los modelos con la base de datos
sequelize.sync().then(r => {
  console.log('Tablas sincronizadas');
});

module.exports = sequelize;


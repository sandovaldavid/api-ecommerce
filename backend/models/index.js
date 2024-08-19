const { Sequelize } = require('sequelize');
const config = require('../config/config');

// Crear una instancia de Sequelize utilizando la configuración de desarrollo
const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
  }
);

// Importar los modelos
const User = require('./user')(sequelize, Sequelize.DataTypes);
const Product = require('./product')(sequelize, Sequelize.DataTypes);
const Category = require('./category')(sequelize, Sequelize.DataTypes);
const Order = require('./order')(sequelize, Sequelize.DataTypes);
const Cart = require('./cart')(sequelize, Sequelize.DataTypes);
const Payment = require('./payment')(sequelize, Sequelize.DataTypes);
const Review = require('./review')(sequelize, Sequelize.DataTypes);

// Definir relaciones entre los modelos
Product.belongsTo(Category, { foreignKey: 'categoria_id' });
Category.hasMany(Product, { foreignKey: 'categoria_id' });

Order.belongsTo(User, { foreignKey: 'usuario_id' });
Order.belongsToMany(Product, { through: 'OrderProducts' });

Cart.belongsTo(User, { foreignKey: 'usuario_id' });
Cart.belongsToMany(Product, { through: 'CartItems' });

Review.belongsTo(User, { foreignKey: 'usuario_id' });
Review.belongsTo(Product, { foreignKey: 'producto_id' });

Payment.belongsTo(Order, { foreignKey: 'orden_id' });

// Sincronizar los modelos con la base de datos
sequelize.sync().then(() => {
  console.log('Tablas sincronizadas');
}).catch((error) => {
  console.error('Error al sincronizar las tablas:', error);
});

// Exportar la instancia de sequelize y los modelos
module.exports = { sequelize, User, Product, Category, Order, Cart, Payment, Review };



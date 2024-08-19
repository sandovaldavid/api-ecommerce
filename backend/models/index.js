const {Sequelize} = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
  }
);

sequelize.sync().then(() => console.log('Database connected')).catch(e => console.log(e));

module.exports = sequelize;

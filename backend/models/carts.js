import {DataTypes} from 'sequelize';
import {sequelize} from './index.js';
import User from './user.js';
import Product from './product.js';

const Carts = sequelize.define('Carts', {
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

Carts.belongsTo(User, {foreignKey: 'usuario_id'});
Carts.belongsToMany(Product, {through: 'CartItems'});

export default Carts;

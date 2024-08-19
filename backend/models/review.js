const {DataTypes} = require('sequelize');
const sequelize = require('./index');
const User = require('./user');
const Product = require('./product');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  review_text: {
    type: DataTypes.TEXT,
    allowNull: true,
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

Review.belongsTo(User, {foreignKey: 'usuario_id'});
Review.belongsTo(Product, {foreignKey: 'producto_id'});

module.exports = Review;

<<<<<<< HEAD
const { DataTypes } = require('sequelize');
=======
const {DataTypes} = require('sequelize');
>>>>>>> 0a617c9ecd3d71cd615d64436f6b633f50d9ff79
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

<<<<<<< HEAD
Review.belongsTo(User, { foreignKey: 'usuario_id' });
Review.belongsTo(Product, { foreignKey: 'producto_id' });
=======
Review.belongsTo(User, {foreignKey: 'usuario_id'});
Review.belongsTo(Product, {foreignKey: 'producto_id'});
>>>>>>> 0a617c9ecd3d71cd615d64436f6b633f50d9ff79

module.exports = Review;

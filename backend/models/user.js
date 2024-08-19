<<<<<<< HEAD
const { DataTypes } = require('sequelize');
=======
const {DataTypes} = require('sequelize');
>>>>>>> 0a617c9ecd3d71cd615d64436f6b633f50d9ff79
const bcrypt = require('bcryptjs');
const sequelize = require('./index');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  hashed_password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('cliente', 'administrador'),
    defaultValue: 'cliente',
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
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
    },
  },
  timestamps: false,
});

<<<<<<< HEAD
User.prototype.checkPassword = function(password) {
=======
User.prototype.checkPassword = function (password) {
>>>>>>> 0a617c9ecd3d71cd615d64436f6b633f50d9ff79
  return bcrypt.compare(password, this.hashed_password);
};

module.exports = User;

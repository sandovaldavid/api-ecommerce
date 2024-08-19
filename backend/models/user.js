const {DataTypes} = require('sequelize');
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
}, {
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
    },
  },
});

User.prototype.checkPassword = function (password) {
  return bcrypt.compare(password, this.hashed_password);
};

module.exports = User;

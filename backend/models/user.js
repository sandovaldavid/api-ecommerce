const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
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
      // Hash the password before saving the user to the database
      beforeCreate: async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
      },
      // Optionally, hash the password before updating the user
      beforeUpdate: async (user) => {
        if (user.changed('hashed_password')) {
          const salt = await bcrypt.genSalt(10);
          user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
        }
      }
    },
    timestamps: false,
  });

  // Method to check password validity
  User.prototype.checkPassword = function (password) {
    return bcrypt.compare(password, this.hashed_password);
  };

  return User;
};


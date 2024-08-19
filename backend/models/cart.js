module.exports = (sequelize, DataTypes) => {
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

  // Definir relaciones
  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: 'usuario_id' });
    Cart.belongsToMany(models.Product, { through: 'CartItems' });
  };

  return Cart;
};


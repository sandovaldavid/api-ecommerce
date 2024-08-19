module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'enviado', 'entregado'),
      defaultValue: 'pendiente',
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
  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'usuario_id' });
    Order.belongsToMany(models.Product, { through: 'OrderProducts' });
  };

  return Order;
};


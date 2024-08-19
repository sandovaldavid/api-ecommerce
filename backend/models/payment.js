const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Order = require('./order');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  payment_method: {
    type: DataTypes.ENUM('tarjeta_credito', 'paypal'),
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.ENUM('pagado', 'pendiente'),
    defaultValue: 'pendiente',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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

Payment.belongsTo(Order, { foreignKey: 'orden_id' });

module.exports = Payment;

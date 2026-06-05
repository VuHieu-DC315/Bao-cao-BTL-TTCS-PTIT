module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define("orders", {
    tutorialId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    originalAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    voucherCode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    voucherDiscount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    finalAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return Order;
};


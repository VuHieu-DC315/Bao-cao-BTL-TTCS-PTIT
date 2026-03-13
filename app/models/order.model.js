module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define("orders", {
    tutorialId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  });

  return Order;
};
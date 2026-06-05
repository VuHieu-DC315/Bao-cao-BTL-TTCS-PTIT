module.exports = (sequelize, Sequelize) => {
  const Cart = sequelize.define("cart", {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
    },
  });

  return Cart;
};

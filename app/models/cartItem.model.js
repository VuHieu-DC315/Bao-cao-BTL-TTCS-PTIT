module.exports = (sequelize, Sequelize) => {
  const CartItem = sequelize.define("cart_item", {
    cartId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    tutorialId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  });

  return CartItem;
};
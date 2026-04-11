module.exports = (sequelize, Sequelize) => {
  const Voucher = sequelize.define("vouchers", {
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    discountType: {
      type: Sequelize.ENUM("percent", "fixed"),
      allowNull: false,
      defaultValue: "fixed",
    },
    discountValue: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxDiscount: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    minOrderTotal: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    appliesTo: {
      type: Sequelize.ENUM("all", "product"),
      allowNull: false,
      defaultValue: "all",
    },
    tutorialId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    usedCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    startDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });

  return Voucher;
};
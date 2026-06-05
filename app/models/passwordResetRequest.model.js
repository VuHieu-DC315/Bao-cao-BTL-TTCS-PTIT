module.exports = (sequelize, Sequelize) => {
  const PasswordResetRequest = sequelize.define("PasswordResetRequest", {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    tk: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  });

  return PasswordResetRequest;
};

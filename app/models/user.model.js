module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "Users",
    {
      tk: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "users_tk_unique",
      },
      mk: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "users_email_unique",
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      timestamps: false,
    }
  );

  return User;
};
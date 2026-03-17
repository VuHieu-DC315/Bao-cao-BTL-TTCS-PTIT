module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("Users", {
    tk: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    mk: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "user"
    }
  }, {
    timestamps: false
  });

  return User;
};
module.exports = (sequelize, Sequelize) => {
  const Tutorial = sequelize.define("tutorial", {
    title: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    published: {
      type: Sequelize.BOOLEAN
    }
  });

  return Tutorial;
};
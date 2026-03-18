module.exports = (sequelize, Sequelize) => {
  const Announcement = sequelize.define("announcement", {
    title: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.TEXT
    },
    startDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    isPermanent: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return Announcement;
};
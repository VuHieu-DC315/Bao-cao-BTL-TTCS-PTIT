module.exports = (sequelize, Sequelize) => {
  const Tutorial = sequelize.define("tutorial", {
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    imageData: {
      // Lưu dữ liệu ảnh trực tiếp trong MySQL bằng kiểu LONGBLOB
      type: Sequelize.BLOB("long"),
      allowNull: true,
    },
    imageMimeType: {
      // Ví dụ: image/jpeg, image/png, image/webp
      type: Sequelize.STRING,
      allowNull: true,
    },
    published: {
      type: Sequelize.BOOLEAN,
    },
  });

  return Tutorial;
};

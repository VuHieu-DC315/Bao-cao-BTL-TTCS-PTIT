const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,
  port: dbConfig.PORT,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.tutorials = require("./tutorial.model.js")(sequelize, Sequelize);
db.orders = require("./order.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);
db.carts = require("./cart.model.js")(sequelize, Sequelize);
db.cartItems = require("./cartItem.model.js")(sequelize, Sequelize);
db.users.hasOne(db.carts, { foreignKey: "userId" });
db.carts.belongsTo(db.users, { foreignKey: "userId" });

db.carts.hasMany(db.cartItems, { foreignKey: "cartId" });
db.cartItems.belongsTo(db.carts, { foreignKey: "cartId" });

db.tutorials.hasMany(db.cartItems, { foreignKey: "tutorialId" });
db.cartItems.belongsTo(db.tutorials, { foreignKey: "tutorialId" });

module.exports = db;
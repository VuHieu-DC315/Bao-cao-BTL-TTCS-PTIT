const {
  create,
  getCreate,
  findOne,
  update,
  getAll,
  getHomesalePage,
  getBuyPage,
  buyTutorial,
  getAllOrders
} = require("../controllers/tutorial.controller");

module.exports = app => {
  const router = require("express").Router();

  // Admin product pages
  router.get("/", getAll);
  router.get("/new", getCreate);
  router.post("/", create);
  router.get("/:id", findOne);
  router.put("/:id", update);

  app.use("/admin/products", router);

  // Public shop pages
  app.get("/shop", getHomesalePage);
  app.get("/products/:id", getBuyPage);

  // Create order from buy page
  app.post("/orders", buyTutorial);

  // Admin orders page
  app.get("/admin/orders", getAllOrders);
};
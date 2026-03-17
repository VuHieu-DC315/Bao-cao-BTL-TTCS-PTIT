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

  // Admin routes
  router.get("/", getAll);
  router.get("/create", getCreate);
  router.post("/create", create);
  router.get("/:id", findOne);
  router.put("/:id", update);

  app.use("/tutorials", router);

  // User routes
  app.get("/homepage", getHomesalePage);
  app.get("/homepage/:id", getBuyPage);
  app.post("/buy", buyTutorial);

  //admin get orders  
  app.get("/orders", getAllOrders);
};
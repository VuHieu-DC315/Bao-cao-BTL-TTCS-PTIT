const { create, getCreate, findOne, update,
  getAll,getHomesalePage,getBuyPage, buyTutorial

} = require("../controllers/tutorial.controller");

module.exports = app => {

  var router = require("express").Router();

  // Create a new Tutorial
  router.get("/", getAll)
  router.post("/create", create);

  router.get("/create", getCreate);

  // Main sales page
  router.get("/homePage", getHomesalePage);
  // buy a Tutorial with id
  router.get("/homePage/:id", getBuyPage);

  // Retrieve a single Tutorial with id
  router.get("/:id", findOne);

  // Update a Tutorial with id
  router.put("/:id", update);

  // buy a Tutorial
  router.post("/buy", buyTutorial);

  app.use('/tutorials', router);

  
};

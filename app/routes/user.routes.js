module.exports = app => {
  const users = require("../controllers/user.controller.js");
  const router = require("express").Router();

  router.get("/", users.getAllUsers);
  router.post("/create", users.createUser);
  router.get("/edit/:id", users.getEditUserPage);
  router.post("/update/:id", users.updateUser);
  router.get("/delete/:id", users.deleteUser);

  app.use("/admin/users", router);
};
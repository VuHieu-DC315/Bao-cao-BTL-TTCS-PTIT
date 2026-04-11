module.exports = app => {
  const users = require("../controllers/user.controller.js");
  const router = require("express").Router();

  router.get("/", users.getAllUsers);
  router.post("/", users.createUser);
  router.get("/:id/edit", users.getEditUserPage);
  router.post("/:id", users.updateUser);
  router.post("/:id/delete", users.deleteUser);

  // Route tương thích ngược cho form/action cũ
  router.post("/update/:id", users.updateUser);
  router.post("/delete/:id", users.deleteUser);

  app.use("/admin/users", router);
};
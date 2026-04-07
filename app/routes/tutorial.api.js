module.exports = (app) => {
  const tutorials = require("../controllers/api.controller.js");
  const router = require("express").Router();

  function checkAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send({
        message: "Bạn không có quyền truy cập API admin",
      });
    }
    next();
  }

  router.post("/", checkAdmin, tutorials.create);
  router.get("/", checkAdmin, tutorials.findAll);
  router.get("/published", tutorials.findAllPublished);
  router.get("/:id", checkAdmin, tutorials.findOne);
  router.put("/:id", checkAdmin, tutorials.update);
  router.delete("/:id", checkAdmin, tutorials.delete);
  router.delete("/", checkAdmin, tutorials.deleteAll);

  app.use("/api/tutorials", router);
};

module.exports = (app) => {
  const tutorials = require("../controllers/api.controller.js");
  const router = require("express").Router();
  const multer = require("multer");

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error("Chỉ cho phép ảnh JPG/JPEG/PNG/WEBP"));
    },
  });

  function uploadProductImage(req, res, next) {
    upload.single("image")(req, res, function (err) {
      if (err) {
        return res.status(400).send({ message: err.message || "Upload ảnh thất bại" });
      }
      next();
    });
  }

  function checkAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send({
        message: "Bạn không có quyền truy cập API admin",
      });
    }
    next();
  }

  router.post("/", checkAdmin, uploadProductImage, tutorials.create);
  router.get("/", checkAdmin, tutorials.findAll);
  router.get("/published", tutorials.findAllPublished);
  router.get("/:id", checkAdmin, tutorials.findOne);
  router.put("/:id", checkAdmin, uploadProductImage, tutorials.update);
  router.delete("/:id", checkAdmin, tutorials.delete);
  router.delete("/", checkAdmin, tutorials.deleteAll);

  app.use("/api/tutorials", router);
};

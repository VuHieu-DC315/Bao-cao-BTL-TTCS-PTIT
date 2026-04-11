const {
  create,
  getCreate,
  findOne,
  update,
  getAll,
  getHomesalePage,
  getBuyPage,
  buyTutorial,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  getRevenuePage,
} = require("../controllers/tutorial.controller");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Chỉ cho phép ảnh JPG/JPEG"));
  },
});

module.exports = (app) => {
  const router = require("express").Router();

  function checkAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("Bạn không có quyền vào trang admin");
    }
    next();
  }

  router.get("/", checkAdmin, getAll);
  router.get("/new", checkAdmin, getCreate);
  router.post(
    "/",
    checkAdmin,
    (req, res, next) => {
      upload.single("image")(req, res, function (err) {
        if (err) {
          return res.status(400).send(err.message || "Upload ảnh thất bại");
        }
        next();
      });
    },
    create,
  );
  router.get("/:id", checkAdmin, findOne);
  router.put("/:id", checkAdmin, update);

  app.use("/admin/products", router);

  app.get("/shop", getHomesalePage);
  app.get("/products/:id", getBuyPage);
  app.post("/orders", buyTutorial);

  app.get("/admin/orders", getAllOrders);
  app.post("/admin/orders/:id/status", updateOrderStatus);
  app.get("/admin/revenue", getRevenuePage);

  app.get("/my-orders", getMyOrders);
};
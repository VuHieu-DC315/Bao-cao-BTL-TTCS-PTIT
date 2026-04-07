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
} = require("../controllers/tutorial.controller");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
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

function checkAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Bạn không có quyền truy cập chức năng admin");
  }
  next();
}

module.exports = (app) => {
  const router = require("express").Router();

  // Admin product pages
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

  // Public shop pages
  app.get("/shop", getHomesalePage);
  app.get("/products/:id", getBuyPage);

  // Create order from buy page
  app.post("/orders", buyTutorial);

  // Admin orders page
  app.get("/admin/orders", checkAdmin, getAllOrders);
  app.post("/admin/orders/:id/status", checkAdmin, updateOrderStatus);

  // User orders page
  app.get("/my-orders", getMyOrders);
};

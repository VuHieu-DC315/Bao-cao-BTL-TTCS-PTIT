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

  // Admin product pages
  router.get("/", getAll);
  router.get("/new", getCreate);
  router.post(
    "/",
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
  app.post("/admin/orders/:id/status", updateOrderStatus);
  app.get("/admin/revenue", getRevenuePage);

  // User orders page
  app.get("/my-orders", getMyOrders);
};

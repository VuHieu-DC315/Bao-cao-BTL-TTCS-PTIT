const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucher.controller");

function checkAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Bạn không có quyền");
  }
  next();
}

router.get("/", checkAdmin, voucherController.getAllVouchers);
router.get("/new", checkAdmin, voucherController.getCreateVoucherPage);
router.post("/", checkAdmin, voucherController.createVoucher);
router.get("/:id/edit", checkAdmin, voucherController.getEditVoucherPage);
router.post("/:id", checkAdmin, voucherController.updateVoucher);
router.post("/:id/delete", checkAdmin, voucherController.deleteVoucher);

// Route tương thích ngược cho link/form cũ
router.get("/create", checkAdmin, voucherController.getCreateVoucherPage);
router.get("/edit/:id", checkAdmin, voucherController.getEditVoucherPage);
router.post("/update/:id", checkAdmin, voucherController.updateVoucher);
router.post("/delete/:id", checkAdmin, voucherController.deleteVoucher);

module.exports = router;
const db = require("../models");
const Voucher = db.vouchers;
const Tutorial = db.tutorials;
const Op = db.Sequelize.Op;

function parseBoolean(value) {
  return (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1 ||
    value === "on"
  );
}

function normalizeVoucherBody(body) {
  const appliesTo =
    body.appliesTo === "product" || body.appliesTo === "tutorial"
      ? "product"
      : "all";

  const parsedDiscountValue = parseInt(body.discountValue, 10);
  const parsedMaxDiscount = parseInt(body.maxDiscount, 10);
  const parsedMinOrderTotal = parseInt(body.minOrderTotal, 10);
  const parsedQuantity = parseInt(body.quantity, 10);
  const parsedTutorialId = parseInt(body.tutorialId, 10);

  return {
    code: String(body.code || "").trim().toUpperCase(),
    name: String(body.name || "").trim(),
    discountType: body.discountType === "percent" ? "percent" : "fixed",
    discountValue:
      Number.isInteger(parsedDiscountValue) && parsedDiscountValue >= 0
        ? parsedDiscountValue
        : 0,
    maxDiscount:
      Number.isInteger(parsedMaxDiscount) && parsedMaxDiscount >= 0
        ? parsedMaxDiscount
        : null,
    minOrderTotal:
      Number.isInteger(parsedMinOrderTotal) && parsedMinOrderTotal >= 0
        ? parsedMinOrderTotal
        : 0,
    appliesTo,
    tutorialId:
      appliesTo === "product" &&
      Number.isInteger(parsedTutorialId) &&
      parsedTutorialId > 0
        ? parsedTutorialId
        : null,
    quantity:
      Number.isInteger(parsedQuantity) && parsedQuantity >= 0
        ? parsedQuantity
        : 0,
    isActive: parseBoolean(body.isActive),
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
  };
}

function validateVoucherData(data) {
  if (!data.code) {
    return "Vui lòng nhập mã voucher";
  }

  if (!data.name) {
    return "Vui lòng nhập tên voucher";
  }

  if (data.discountValue < 0) {
    return "Giá trị giảm không hợp lệ";
  }

  if (data.discountType === "percent" && data.discountValue > 100) {
    return "Voucher phần trăm không được vượt quá 100";
  }

  if (data.maxDiscount !== null && data.maxDiscount < 0) {
    return "Giảm tối đa không hợp lệ";
  }

  if (data.minOrderTotal < 0) {
    return "Giá trị đơn tối thiểu không hợp lệ";
  }

  if (data.quantity < 0) {
    return "Số lượng voucher không hợp lệ";
  }

  if (data.appliesTo === "product" && !data.tutorialId) {
    return "Voucher theo sản phẩm phải chọn sản phẩm áp dụng";
  }

  if (
    data.startDate &&
    data.endDate &&
    new Date(data.startDate) > new Date(data.endDate)
  ) {
    return "Ngày bắt đầu không được lớn hơn ngày kết thúc";
  }

  return null;
}

module.exports = {
  getAllVouchers: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const vouchers = await Voucher.findAll({
        include: [
          {
            model: Tutorial,
            attributes: ["id", "title"],
            required: false,
          },
        ],
        order: [["id", "DESC"]],
      });

      return res.render("vouchers.ejs", {
        vouchers,
      });
    } catch (error) {
      console.log("getAllVouchers error =", error);
      return res.status(500).send("Lỗi lấy danh sách voucher");
    }
  },

  getCreateVoucherPage: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
      });

      return res.render("editVoucher.ejs", {
        voucher: null,
        tutorials,
        mode: "create",
        formAction: "/admin/vouchers",
      });
    } catch (error) {
      console.log("getCreateVoucherPage error =", error);
      return res.status(500).send("Lỗi mở trang tạo voucher");
    }
  },

  createVoucher: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const data = normalizeVoucherBody(req.body);

      const validationError = validateVoucherData(data);
      if (validationError) {
        return res.send(validationError);
      }

      const existedVoucher = await Voucher.findOne({
        where: {
          code: data.code,
        },
      });

      if (existedVoucher) {
        return res.send("Mã voucher đã tồn tại");
      }

      if (data.appliesTo === "product") {
        const tutorial = await Tutorial.findByPk(data.tutorialId);
        if (!tutorial) {
          return res.send("Sản phẩm áp dụng không tồn tại");
        }
      }

      await Voucher.create(data);

      return res.redirect("/admin/vouchers");
    } catch (error) {
      console.log("createVoucher error =", error);
      return res.status(500).send("Lỗi tạo voucher");
    }
  },

  getEditVoucherPage: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const id = parseInt(req.params.id, 10);

      if (!Number.isInteger(id) || id <= 0) {
        return res.send("ID voucher không hợp lệ");
      }

      const voucher = await Voucher.findByPk(id);

      if (!voucher) {
        return res.send("Không tìm thấy voucher");
      }

      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
      });

      return res.render("editVoucher.ejs", {
        voucher,
        tutorials,
        mode: "edit",
        formAction: `/admin/vouchers/${voucher.id}`,
      });
    } catch (error) {
      console.log("getEditVoucherPage error =", error);
      return res.status(500).send("Lỗi mở trang sửa voucher");
    }
  },

  updateVoucher: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const id = parseInt(req.params.id, 10);

      if (!Number.isInteger(id) || id <= 0) {
        return res.send("ID voucher không hợp lệ");
      }

      const voucher = await Voucher.findByPk(id);

      if (!voucher) {
        return res.send("Không tìm thấy voucher");
      }

      const data = normalizeVoucherBody(req.body);

      const validationError = validateVoucherData(data);
      if (validationError) {
        return res.send(validationError);
      }

      const existedVoucher = await Voucher.findOne({
        where: {
          id: { [Op.ne]: id },
          code: data.code,
        },
      });

      if (existedVoucher) {
        return res.send("Mã voucher đã tồn tại ở voucher khác");
      }

      if (data.appliesTo === "product") {
        const tutorial = await Tutorial.findByPk(data.tutorialId);
        if (!tutorial) {
          return res.send("Sản phẩm áp dụng không tồn tại");
        }
      }

      if (data.quantity < voucher.usedCount) {
        return res.send("Số lượng voucher không được nhỏ hơn số lần đã dùng");
      }

      await Voucher.update(data, {
        where: { id: id },
      });

      return res.redirect("/admin/vouchers");
    } catch (error) {
      console.log("updateVoucher error =", error);
      return res.status(500).send("Lỗi cập nhật voucher");
    }
  },

  deleteVoucher: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const id = parseInt(req.params.id, 10);

      if (!Number.isInteger(id) || id <= 0) {
        return res.send("ID voucher không hợp lệ");
      }

      const voucher = await Voucher.findByPk(id);

      if (!voucher) {
        return res.send("Không tìm thấy voucher");
      }

      await Voucher.destroy({
        where: { id: id },
      });

      return res.redirect("/admin/vouchers");
    } catch (error) {
      console.log("deleteVoucher error =", error);
      return res.status(500).send("Lỗi xóa voucher");
    }
  },
};
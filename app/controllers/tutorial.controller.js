const fs = require("fs");
const path = require("path");
const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Voucher = db.vouchers;
const Announcement = db.announcements;
const Op = db.Sequelize.Op;

const {
  normalizeVoucherCode,
  isVoucherInTime,
  calculateDiscount,
} = require("../utils/voucher");

function parseNonNegativeInt(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function parsePositiveInt(value, defaultValue = 1) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parsePublishedValue(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1" ||
    value === "on"
  );
}

function getGuestOrderIds(req) {
  if (!Array.isArray(req.session.guestOrderIds)) {
    req.session.guestOrderIds = [];
  }
  return req.session.guestOrderIds;
}

function addGuestOrderId(req, orderId) {
  const guestOrderIds = getGuestOrderIds(req);
  if (!guestOrderIds.includes(orderId)) {
    guestOrderIds.unshift(orderId);
  }
  req.session.guestOrderIds = guestOrderIds;
}

function formatAnnouncements(announcements) {
  const uniqueAnnouncements = [];
  const seenIds = new Set();

  for (const item of announcements) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueAnnouncements.push(item);
    }
  }

  const formatVN = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(date));
  };

  return uniqueAnnouncements.map((item) => ({
    ...item.toJSON(),
    startDateVN: item.startDate ? formatVN(item.startDate) : null,
    endDateVN: item.endDate ? formatVN(item.endDate) : null,
  }));
}

module.exports = {
  getAll: async (req, res) => {
    try {
      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
      });

      return res.render("tutorial.ejs", { tutorials });
    } catch (error) {
      console.log("getAll tutorials error =", error);
      return res.status(500).send("Lỗi khi lấy danh sách sản phẩm");
    }
  },

  getLandingPage: async (req, res) => {
    try {
      const now = new Date();

      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
        limit: 6,
      });

      const announcements = await Announcement.findAll({
        where: {
          [Op.or]: [
            { isPermanent: true },
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    { startDate: null },
                    { startDate: { [Op.lte]: now } },
                  ],
                },
                {
                  [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: now } },
                  ],
                },
              ],
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });

      const formattedAnnouncements = formatAnnouncements(announcements);

      return res.render("home.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user || null,
      });
    } catch (error) {
      console.log("getLandingPage error =", error);
      return res.status(500).send("Lỗi tải trang chủ");
    }
  },

  create: async (req, res) => {
    try {
      const price = parseNonNegativeInt(req.body.price, 0);
      const quantity = parseNonNegativeInt(req.body.quantity, 0);

      const tutorial = await Tutorial.create({
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        price,
        quantity,
        published: parsePublishedValue(req.body.published) && quantity > 0,
      });

      if (req.file && req.file.buffer) {
        const imageDir = path.join(__dirname, "../public/image");
        fs.mkdirSync(imageDir, { recursive: true });
        fs.writeFileSync(path.join(imageDir, `${tutorial.id}.jpg`), req.file.buffer);
      }

      return res.redirect("/admin/products");
    } catch (error) {
      console.log("create tutorial error =", error);
      return res.status(500).send("Lỗi khi tạo sản phẩm");
    }
  },

  getCreate: (req, res) => {
    return res.render("create.ejs");
  },

  getHomesalePage: async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      const now = new Date();

      const tutorialWhere = q
        ? {
            [Op.or]: [
              { title: { [Op.like]: `%${q}%` } },
              { description: { [Op.like]: `%${q}%` } },
            ],
          }
        : {};

      const tutorials = await Tutorial.findAll({
        where: tutorialWhere,
        order: [["id", "DESC"]],
      });

      const announcements = await Announcement.findAll({
        where: {
          [Op.or]: [
            { isPermanent: true },
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    { startDate: null },
                    { startDate: { [Op.lte]: now } },
                  ],
                },
                {
                  [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: now } },
                  ],
                },
              ],
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });

      const formattedAnnouncements = formatAnnouncements(announcements);

      return res.render("homepage.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user || null,
        q,
      });
    } catch (error) {
      console.log("getHomesalePage error =", error);
      return res.status(500).send("Lỗi tải trang homepage");
    }
  },

  getBuyPage: async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tutorial = await Tutorial.findByPk(id);

    if (!tutorial) {
      return res.status(404).send(`Cannot find tutorial with id=${req.params.id}`);
    }

    let availableVouchers = [];

    if (req.session.user) {
      const rawVouchers = await Voucher.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { appliesTo: "all" },
            { appliesTo: "product", tutorialId: id },
            { appliesTo: "tutorial", tutorialId: id },
          ],
        },
        order: [["id", "DESC"]],
      });

      const now = new Date();

      availableVouchers = rawVouchers.filter((voucher) => {
        const inTime =
          (!voucher.startDate || new Date(voucher.startDate) <= now) &&
          (!voucher.endDate || new Date(voucher.endDate) >= now);

        const stillAvailable =
          Number(voucher.usedCount || 0) < Number(voucher.quantity || 0);

        return inTime && stillAvailable;
      });
    }

    return res.render("buypage.ejs", {
      tutorial,
      user: req.session.user || null,
      availableVouchers,
    });
  } catch (error) {
    console.log("getBuyPage error =", error);
    return res.status(500).send("Lỗi tải trang mua hàng");
  }
},

  buyTutorial: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const tutorialId = Number(req.body.tutorialId);
      const buyQuantity = Number(req.body.quantity);
      const email = String(req.body.email || "").trim();
      const phone = String(req.body.phone || "").trim();

      if (!tutorialId || !Number.isInteger(buyQuantity) || buyQuantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Dữ liệu mua hàng không hợp lệ",
        });
      }

      if (!email || !phone) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Vui lòng nhập email và số điện thoại",
        });
      }

      const tutorial = await Tutorial.findByPk(tutorialId, { transaction });

      if (!tutorial) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Sản phẩm không tồn tại",
        });
      }

      if (!tutorial.published) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Sản phẩm hiện không thể mua",
        });
      }

      if (Number(tutorial.quantity || 0) < buyQuantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Số lượng mua vượt quá tồn kho",
        });
      }

      const originalAmount = buyQuantity * Number(tutorial.price || 0);
      const voucherCode = normalizeVoucherCode(req.body.voucherCode);
      let voucherDiscount = 0;
      let finalAmount = originalAmount;

      if (voucherCode) {
        if (!req.session.user) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Bạn cần đăng nhập để dùng voucher",
          });
        }

        const voucher = await Voucher.findOne({
          where: { code: voucherCode },
          transaction,
        });

        if (!voucher) {
          await transaction.rollback();
          return res.status(400).json({ message: "Voucher không tồn tại" });
        }

        if (!voucher.isActive) {
          await transaction.rollback();
          return res.status(400).json({ message: "Voucher đã bị khóa" });
        }

        if (!isVoucherInTime(voucher)) {
          await transaction.rollback();
          return res.status(400).json({ message: "Voucher không còn hiệu lực" });
        }

        if (Number(voucher.usedCount || 0) >= Number(voucher.quantity || 0)) {
          await transaction.rollback();
          return res.status(400).json({ message: "Voucher đã hết lượt sử dụng" });
        }

        if (originalAmount < Number(voucher.minOrderTotal || 0)) {
          await transaction.rollback();
          return res.status(400).json({ message: "Đơn hàng chưa đủ giá trị tối thiểu" });
        }

        if (
          (voucher.appliesTo === "product" || voucher.appliesTo === "tutorial") &&
          Number(voucher.tutorialId) !== Number(tutorial.id)
        ) {
          await transaction.rollback();
          return res.status(400).json({ message: "Voucher không áp dụng cho sản phẩm này" });
        }

        voucherDiscount = calculateDiscount({
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscount: voucher.maxDiscount,
          baseAmount: originalAmount,
        });

        finalAmount = Math.max(0, originalAmount - voucherDiscount);

        voucher.usedCount = Number(voucher.usedCount || 0) + 1;
        await voucher.save({ transaction });
      }

      tutorial.quantity = Number(tutorial.quantity || 0) - buyQuantity;
      if (tutorial.quantity <= 0) {
        tutorial.quantity = 0;
        tutorial.published = false;
      }
      await tutorial.save({ transaction });

      const order = await Order.create(
        {
          userId: req.session.user ? req.session.user.id : null,
          tutorialId: tutorial.id,
          title: tutorial.title,
          quantity: buyQuantity,
          email,
          phone,
          price: Number(tutorial.price || 0),
          originalAmount,
          voucherCode: voucherCode || null,
          voucherDiscount,
          finalAmount,
          status: "pending",
        },
        { transaction },
      );

      await transaction.commit();

      if (!req.session.user) {
        addGuestOrderId(req, order.id);
      }

      return res.status(200).json({
        message: "Mua hàng thành công",
        order,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("buyTutorial error:", error);
      return res.status(500).json({
        message: "Mua hàng thất bại",
      });
    }
  },

  findOne: async (req, res) => {
    try {
      const id = req.params.id;
      const tutorial = await Tutorial.findByPk(id);

      if (!tutorial) {
        return res.status(404).send({
          message: `Cannot find Tutorial with id=${id}.`,
        });
      }

      return res.send(tutorial);
    } catch (error) {
      return res.status(500).send({
        message: "Error retrieving Tutorial with id=" + req.params.id,
      });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const quantity = parseNonNegativeInt(req.body.quantity, 0);

      const dataToUpdate = {
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        quantity,
        published: parsePublishedValue(req.body.published) && quantity > 0,
      };

      if (req.body.price !== undefined) {
        dataToUpdate.price = parseNonNegativeInt(req.body.price, 0);
      }

      const [updatedRows] = await Tutorial.update(dataToUpdate, {
        where: { id },
      });

      if (updatedRows === 1) {
        return res.send({
          message: "Tutorial was updated successfully.",
        });
      }

      return res.send({
        message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`,
      });
    } catch (error) {
      return res.status(500).send({
        message: "Error updating Tutorial with id=" + req.params.id,
      });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền vào trang admin");
      }

      const orders = await Order.findAll({
        order: [["id", "DESC"]],
      });

      return res.render("order.ejs", {
        orders,
      });
    } catch (error) {
      console.log("getAllOrders error =", error);
      return res.status(500).send("Lỗi khi lấy danh sách orders");
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res
          .status(403)
          .send("Bạn không có quyền cập nhật trạng thái đơn hàng");
      }

      const id = req.params.id;
      const { status } = req.body;

      const allowedStatuses = [
        "pending",
        "confirmed",
        "shipping",
        "completed",
        "cancelled",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send("Trạng thái không hợp lệ");
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).send("Không tìm thấy đơn hàng");
      }

      order.status = status;
      await order.save();

      return res.redirect("/admin/orders");
    } catch (error) {
      console.log("updateOrderStatus error =", error);
      return res.status(500).send("Lỗi cập nhật trạng thái đơn hàng");
    }
  },

  getRevenuePage: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền vào trang admin");
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const parsedYear = parseInt(req.query.year, 10);
      const parsedMonth = parseInt(req.query.month, 10);

      const selectedYear = Number.isInteger(parsedYear)
        ? parsedYear
        : currentYear;
      const selectedMonth =
        Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
          ? parsedMonth
          : currentMonth;

      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
      });

      const tutorialMap = new Map();
      tutorials.forEach((tutorial) => {
        tutorialMap.set(Number(tutorial.id), tutorial);
      });

      const completedOrders = await Order.findAll({
        where: { status: "completed" },
        order: [["createdAt", "DESC"]],
      });

      const availableYearSet = new Set([currentYear]);
      const productStatsMap = new Map();

      let totalRevenueMonth = 0;
      let totalUnitsSoldMonth = 0;
      let totalOrdersMonth = 0;

      completedOrders.forEach((order) => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : null;

        if (!orderDate || Number.isNaN(orderDate.getTime())) {
          return;
        }

        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1;
        availableYearSet.add(orderYear);

        if (orderYear !== selectedYear || orderMonth !== selectedMonth) {
          return;
        }

        const quantity = Number(order.quantity) || 0;
        const unitPrice = Number(order.price) || 0;
        const revenue =
          Number(order.finalAmount || 0) > 0
            ? Number(order.finalAmount || 0)
            : Number(order.originalAmount || 0) > 0
              ? Number(order.originalAmount || 0)
              : quantity * unitPrice;

        totalRevenueMonth += revenue;
        totalUnitsSoldMonth += quantity;
        totalOrdersMonth += 1;

        const tutorial = tutorialMap.get(Number(order.tutorialId));
        const existing = productStatsMap.get(Number(order.tutorialId)) || {
          id: Number(order.tutorialId),
          title:
            tutorial?.title || order.title || `Sản phẩm #${order.tutorialId}`,
          price: tutorial?.price || unitPrice,
          orderCount: 0,
          unitsSold: 0,
          revenue: 0,
        };

        existing.orderCount += 1;
        existing.unitsSold += quantity;
        existing.revenue += revenue;

        productStatsMap.set(Number(order.tutorialId), existing);
      });

      const monthOptions = [
        { value: 1, label: "Tháng 1" },
        { value: 2, label: "Tháng 2" },
        { value: 3, label: "Tháng 3" },
        { value: 4, label: "Tháng 4" },
        { value: 5, label: "Tháng 5" },
        { value: 6, label: "Tháng 6" },
        { value: 7, label: "Tháng 7" },
        { value: 8, label: "Tháng 8" },
        { value: 9, label: "Tháng 9" },
        { value: 10, label: "Tháng 10" },
        { value: 11, label: "Tháng 11" },
        { value: 12, label: "Tháng 12" },
      ];

      const selectedMonthLabel =
        monthOptions.find((item) => item.value === selectedMonth)?.label ||
        `Tháng ${selectedMonth}`;

      const productStats = Array.from(productStatsMap.values()).sort(
        (a, b) =>
          b.unitsSold - a.unitsSold ||
          b.revenue - a.revenue ||
          b.orderCount - a.orderCount ||
          a.id - b.id,
      );

      const availableYears = Array.from(availableYearSet).sort((a, b) => b - a);
      const soldProductCount = productStats.length;

      return res.render("revenue.ejs", {
        selectedYear,
        selectedMonth,
        selectedMonthLabel,
        availableYears,
        monthOptions,
        totalRevenueMonth,
        totalUnitsSoldMonth,
        totalOrdersMonth,
        soldProductCount,
        productStats,
      });
    } catch (error) {
      console.log("getRevenuePage error =", error);
      return res.status(500).send("Lỗi khi tải trang doanh thu");
    }
  },

  getMyOrders: async (req, res) => {
    try {
      let orders = [];

      const guestOrderIds = getGuestOrderIds(req).filter(
        (id) => Number.isInteger(Number(id)) && Number(id) > 0,
      );

      if (req.session.user) {
        const where = guestOrderIds.length > 0
          ? {
              [Op.or]: [
                { userId: req.session.user.id },
                { id: guestOrderIds, userId: null },
              ],
            }
          : {
              userId: req.session.user.id,
            };

        orders = await Order.findAll({
          where,
          order: [["id", "DESC"]],
        });
      } else if (guestOrderIds.length > 0) {
        orders = await Order.findAll({
          where: {
            id: guestOrderIds,
            userId: null,
          },
          order: [["id", "DESC"]],
        });
      }

      return res.render("myOrders.ejs", {
        orders,
        user: req.session.user || null,
      });
    } catch (error) {
      console.log("getMyOrders error =", error);
      return res.status(500).send("Lỗi khi lấy đơn hàng của bạn");
    }
  },
};
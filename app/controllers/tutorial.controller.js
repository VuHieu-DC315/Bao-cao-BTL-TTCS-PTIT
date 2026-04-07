const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Op = db.Sequelize.Op;
const Announcement = db.announcements;
const fs = require("fs");
const path = require("path");
module.exports = {
  getAll: async (req, res) => {
    let tutorials = await Tutorial.findAll();
    return res.render("tutorial.ejs", { tutorials });
  },

  getLandingPage: async (req, res) => {
    try {
      const now = new Date();

      const tutorials = await Tutorial.findAll({
        order: [["id", "DESC"]],
        limit: 6,
      });

      let announcements = await Announcement.findAll({
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
                  [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
                },
              ],
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });

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

      const formattedAnnouncements = uniqueAnnouncements.map((item) => ({
        ...item.toJSON(),
        startDateVN: item.startDate ? formatVN(item.startDate) : null,
        endDateVN: item.endDate ? formatVN(item.endDate) : null,
      }));

      return res.render("home.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user,
      });
    } catch (error) {
      console.log("getLandingPage error =", error);
      return res.status(500).send("Lỗi tải trang chủ");
    }
  },

  create: async (req, res) => {
    try {
      const parsedPrice = parseInt(req.body.price, 10);
      const parsedQuantity = parseInt(req.body.quantity, 10);

      const quantity =
        Number.isInteger(parsedQuantity) && parsedQuantity >= 0
          ? parsedQuantity
          : 0;

      const tutorial = {
        title: req.body.title,
        description: req.body.description,
        price:
          Number.isInteger(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
        quantity: quantity,
        published: req.body.published === "true" && quantity > 0,
      };

      await Tutorial.create(tutorial);
      return res.redirect("/admin/products");
    } catch (error) {
      console.log("create tutorial error =", error);
      return res.status(500).send("Lỗi khi tạo sản phẩm");
    }
  },

  getHomesalePage: async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
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
      });

      let announcements = await Announcement.findAll({
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
                  [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
                },
              ],
            },
          ],
        },
        order: [["createdAt", "DESC"]],
      });

      // chống trùng theo id
      const uniqueAnnouncements = [];
      const seenIds = new Set();

      for (const item of announcements) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueAnnouncements.push(item);
        }
      }

      // format giờ VN
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

      const formattedAnnouncements = uniqueAnnouncements.map((item) => ({
        ...item.toJSON(),
        startDateVN: item.startDate ? formatVN(item.startDate) : null,
        endDateVN: item.endDate ? formatVN(item.endDate) : null,
      }));

      return res.render("homepage.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user,
        q: q,
      });
    } catch (error) {
      console.log("getHomesalePage error =", error);
      return res.status(500).send("Lỗi tải trang homepage");
    }
  },

  getBuyPage: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect(
          "/login?error=" + encodeURIComponent("Bạn cần đăng nhập để mua hàng"),
        );
      }

      const id = req.params.id;
      const tutorial = await Tutorial.findByPk(id);

      if (!tutorial) {
        return res.status(404).send(`Cannot find tutorial with id=${id}`);
      }

      return res.render("buypage.ejs", { tutorial });
    } catch (error) {
      return res.status(500).send("Server error");
    }
  },

  buyTutorial: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          message: "Bạn cần đăng nhập để mua hàng",
        });
      }

      const { tutorialId, quantity, email, phone } = req.body;

      if (!email || !phone) {
        return res.status(400).json({
          message: "Vui lòng nhập email và số điện thoại",
        });
      }

      const tutorial = await Tutorial.findByPk(tutorialId);

      if (!tutorial) {
        return res.status(404).json({
          message: "Sản phẩm không tồn tại",
        });
      }

      const parsedQuantity = parseInt(quantity, 10);
      const buyQuantity =
        Number.isInteger(parsedQuantity) && parsedQuantity > 0
          ? parsedQuantity
          : 1;

      if (!tutorial.published || tutorial.quantity <= 0) {
        return res.status(400).json({
          message: "Sản phẩm đã hết hàng hoặc ngừng bán",
        });
      }

      if (buyQuantity > tutorial.quantity) {
        return res.status(400).json({
          message: "Số lượng mua vượt quá tồn kho",
        });
      }

      const order = await Order.create({
        userId: req.session.user.id,
        tutorialId: tutorial.id,
        title: tutorial.title,
        quantity: buyQuantity,
        email,
        phone,
        price: tutorial.price || 0,
        status: "pending",
      });

      tutorial.quantity = tutorial.quantity - buyQuantity;

      if (tutorial.quantity <= 0) {
        tutorial.quantity = 0;
        tutorial.published = false;
      }

      await tutorial.save();

      return res.json({
        message: "Buy success",
        order,
      });
    } catch (error) {
      console.log("buyTutorial error =", error);
      return res.status(500).json({
        message: "Error when buying tutorial",
      });
    }
  },

  getCreate: (req, res) => {
    return res.render("create.ejs");
  },

  findOne: (req, res) => {
    const id = req.params.id;

    Tutorial.findByPk(id)
      .then((data) => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Tutorial with id=${id}.`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: "Error retrieving Tutorial with id=" + id,
        });
      });
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
        tutorialMap.set(tutorial.id, tutorial);
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
        const revenue = quantity * unitPrice;

        totalRevenueMonth += revenue;
        totalUnitsSoldMonth += quantity;
        totalOrdersMonth += 1;

        const tutorial = tutorialMap.get(order.tutorialId);
        const existing = productStatsMap.get(order.tutorialId) || {
          id: order.tutorialId,
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

        productStatsMap.set(order.tutorialId, existing);
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

  getMyOrders: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect(
          "/login?error=" +
            encodeURIComponent("Bạn cần đăng nhập để xem đơn hàng của mình"),
        );
      }

      const orders = await Order.findAll({
        where: {
          userId: req.session.user.id,
        },
        order: [["id", "DESC"]],
      });

      return res.render("myOrders.ejs", {
        orders,
        user: req.session.user,
      });
    } catch (error) {
      console.log("getMyOrders error =", error);
      return res.status(500).send("Lỗi khi lấy đơn hàng của bạn");
    }
  },

  update: (req, res) => {
    const id = req.params.id;

    Tutorial.update(req.body, {
      where: { id: id },
    })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "Tutorial was updated successfully.",
          });
        } else {
          res.send({
            message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: "Error updating Tutorial with id=" + id,
        });
      });
  },
};

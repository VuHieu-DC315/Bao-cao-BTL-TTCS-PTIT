const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Announcement = db.announcements;
const Op = db.Sequelize.Op;

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
      const quantity = parseNonNegativeInt(req.body.quantity, 0);
      const price = parseNonNegativeInt(req.body.price, 0);

      const createdTutorial = await Tutorial.create({
        title: req.body.title,
        description: req.body.description,
        price,
        quantity,
        published: parsePublishedValue(req.body.published) && quantity > 0,
      });

      if (req.file && req.file.buffer) {
        const fs = require("fs");
        const path = require("path");
        const imageDir = path.join(__dirname, "../public/image");

        if (!fs.existsSync(imageDir)) {
          fs.mkdirSync(imageDir, { recursive: true });
        }

        fs.writeFileSync(
          path.join(imageDir, `${createdTutorial.id}.jpg`),
          req.file.buffer,
        );
      }

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

      return res.render("homepage.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user,
        q,
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
      console.log("getBuyPage error =", error);
      return res.status(500).send("Server error");
    }
  },

  buyTutorial: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      if (!req.session.user) {
        await transaction.rollback();
        return res.status(401).json({
          message: "Bạn cần đăng nhập để mua hàng",
        });
      }

      const { tutorialId, quantity, email, phone } = req.body;

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

      const buyQuantity = parsePositiveInt(quantity, 1);

      if (!tutorial.published || tutorial.quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Sản phẩm đã hết hàng hoặc ngừng bán",
        });
      }

      if (buyQuantity > tutorial.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Số lượng mua vượt quá tồn kho",
        });
      }

      const order = await Order.create(
        {
          userId: req.session.user.id,
          tutorialId: tutorial.id,
          title: tutorial.title,
          quantity: buyQuantity,
          email,
          phone,
          price: tutorial.price || 0,
          status: "pending",
        },
        { transaction },
      );

      tutorial.quantity = tutorial.quantity - buyQuantity;
      if (tutorial.quantity <= 0) {
        tutorial.quantity = 0;
        tutorial.published = false;
      }
      await tutorial.save({ transaction });

      await transaction.commit();

      return res.json({
        message: "Mua hàng thành công",
        order,
      });
    } catch (error) {
      await transaction.rollback();
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
      .catch(() => {
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

  updateOrderStatus: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        await transaction.rollback();
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
        await transaction.rollback();
        return res.status(400).send("Trạng thái không hợp lệ");
      }

      const order = await Order.findByPk(id, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).send("Không tìm thấy đơn hàng");
      }

      if (order.status !== status) {
        const tutorial = await Tutorial.findByPk(order.tutorialId, {
          transaction,
        });

        if (tutorial) {
          const isCancelling =
            order.status !== "cancelled" && status === "cancelled";
          const isReopening =
            order.status === "cancelled" && status !== "cancelled";

          if (isCancelling) {
            tutorial.quantity =
              parseNonNegativeInt(tutorial.quantity, 0) + order.quantity;
            await tutorial.save({ transaction });
          }

          if (isReopening) {
            if (!tutorial.published || tutorial.quantity <= 0) {
              await transaction.rollback();
              return res
                .status(400)
                .send("Sản phẩm đang hết hàng hoặc ngừng bán");
            }

            if (order.quantity > tutorial.quantity) {
              await transaction.rollback();
              return res
                .status(400)
                .send("Không đủ tồn kho để mở lại đơn hàng này");
            }

            tutorial.quantity = tutorial.quantity - order.quantity;
            if (tutorial.quantity <= 0) {
              tutorial.quantity = 0;
              tutorial.published = false;
            }
            await tutorial.save({ transaction });
          }
        }
      }

      order.status = status;
      await order.save({ transaction });
      await transaction.commit();

      return res.redirect("/admin/orders");
    } catch (error) {
      await transaction.rollback();
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

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const quantity = parseNonNegativeInt(req.body.quantity, 0);
      const updateData = {
        title: req.body.title,
        description: req.body.description,
        quantity,
        published: parsePublishedValue(req.body.published) && quantity > 0,
      };

      if (req.body.price !== undefined) {
        updateData.price = parseNonNegativeInt(req.body.price, 0);
      }

      const [updatedRows] = await Tutorial.update(updateData, {
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
      console.log("update tutorial error =", error);
      return res.status(500).send({
        message: "Error updating Tutorial with id=" + req.params.id,
      });
    }
  },
};

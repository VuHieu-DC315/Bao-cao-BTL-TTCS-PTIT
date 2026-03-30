const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Op = db.Sequelize.Op;
const Announcement = db.announcements;

module.exports = {
  getAll: async (req, res) => {
    let tutorials = await Tutorial.findAll();
    return res.render("tutorial.ejs", { tutorials });
  },

  create: async (req, res) => {
    const tutorial = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      published: req.body.published ? req.body.published : false
    };

    await Tutorial.create(tutorial);
    return res.redirect("/admin/products");
  },

  getHomesalePage: async (req, res) => {
    try {
      const tutorials = await Tutorial.findAll();
      const now = new Date();

      let announcements = await Announcement.findAll({
        where: {
          [Op.or]: [
            { isPermanent: true },
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    { startDate: null },
                    { startDate: { [Op.lte]: now } }
                  ]
                },
                {
                  [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: now } }
                  ]
                }
              ]
            }
          ]
        },
        order: [["createdAt", "DESC"]]
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
          second: "2-digit"
        }).format(new Date(date));
      };

      const formattedAnnouncements = uniqueAnnouncements.map(item => ({
        ...item.toJSON(),
        startDateVN: item.startDate ? formatVN(item.startDate) : null,
        endDateVN: item.endDate ? formatVN(item.endDate) : null
      }));

      return res.render("homepage.ejs", {
        tutorials,
        announcements: formattedAnnouncements.slice(0, 3),
        hasMoreAnnouncements: formattedAnnouncements.length > 3,
        user: req.session.user
      });
    } catch (error) {
      console.log("getHomesalePage error =", error);
      return res.status(500).send("Lỗi tải trang homepage");
    }
  },

  getBuyPage: async (req, res) => {
    try {
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
      const { tutorialId, title, quantity, email, phone } = req.body;

      if (!email || !phone) {
        return res.status(400).json({
          message: "Vui lòng nhập email và số điện thoại"
        });
      }

      const order = await Order.create({
        tutorialId,
        title,
        quantity,
        email,
        phone
      });

      return res.json({
        message: "Buy success",
        order
      });
    } catch (error) {
      console.log("buyTutorial error =", error);
      return res.status(500).json({
        message: "Error when buying tutorial"
      });
    }
  },

  getCreate: (req, res) => {
    return res.render("create.ejs");
  },

  findOne: (req, res) => {
    const id = req.params.id;

    Tutorial.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Tutorial with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Tutorial with id=" + id
        });
      });
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.findAll();

      return res.render("order.ejs", {
        orders: orders
      });
    } catch (error) {
      console.log("getAllOrders error =", error);
      return res.status(500).send("Lỗi khi lấy danh sách orders");
    }
  },

  update: (req, res) => {
    const id = req.params.id;

    Tutorial.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Tutorial was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Tutorial with id=" + id
        });
      });
  }
};
const db = require("../models");
const Announcement = db.announcements;
const Op = db.Sequelize.Op;

module.exports = {
  getAllAdmin: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền vào trang admin");
      }

      const announcements = await Announcement.findAll({
        order: [["createdAt", "DESC"]]
      });

      return res.render("announcement_admin.ejs", { announcements });
    } catch (error) {
      console.log("getAllAdmin error =", error);
      return res.status(500).send("Lỗi khi mở trang quản lý thông báo");
    }
  },

  create: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền thực hiện chức năng này");
      }

      const { title, content, startDate, endDate, isPermanent } = req.body;

      await Announcement.create({
        title,
        content,
        startDate: startDate || null,
        endDate: endDate || null,
        isPermanent: isPermanent === "on"
      });

      return res.redirect("/announcements/admin/announcements");
    } catch (error) {
      console.log("create announcement error =", error);
      return res.status(500).send("Lỗi khi tạo thông báo");
    }
  },
  getAllPublic: async (req, res) => {
    try {
      const now = new Date();

      const announcements = await Announcement.findAll({
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

      const result = announcements.map(item => ({
        ...item.toJSON(),
        startDateVN: item.startDate ? formatVN(item.startDate) : null,
        endDateVN: item.endDate ? formatVN(item.endDate) : null
      }));

      return res.render("announcements.ejs", { announcements: result });
    } catch (error) {
      console.log("getAllPublic error =", error);
      return res.status(500).send("Lỗi tải danh sách thông báo");
    }
  }
};
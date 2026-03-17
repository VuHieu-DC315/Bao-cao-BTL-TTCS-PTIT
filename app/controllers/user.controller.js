const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const users = await User.findAll();
      return res.render("users.ejs", { users });
    } catch (error) {
      console.log("getAllUsers error =", error);
      return res.status(500).send("Lỗi lấy danh sách tài khoản");
    }
  },

  createUser: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const { tk, email, mk, role } = req.body;

      if (!tk || !email || !mk || !role) {
        return res.send("Vui lòng nhập đầy đủ thông tin");
      }

      const existedUser = await User.findOne({
        where: {
          [Op.or]: [
            { tk: tk.trim() },
            { email: email.trim() }
          ]
        }
      });

      if (existedUser) {
        return res.send("Tài khoản hoặc email đã tồn tại");
      }

      await User.create({
        tk: tk.trim(),
        email: email.trim(),
        mk: mk,
        role: role
      });

      return res.redirect("/admin/users");
    } catch (error) {
      console.log("createUser error =", error);
      return res.status(500).send("Lỗi tạo tài khoản");
    }
  },

  getEditUserPage: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.send("Không tìm thấy tài khoản");
      }

      return res.render("editUser.ejs", { user });
    } catch (error) {
      console.log("getEditUserPage error =", error);
      return res.status(500).send("Lỗi mở trang sửa tài khoản");
    }
  },

  updateUser: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const { tk, email, mk, role } = req.body;
      const id = req.params.id;

      const existedUser = await User.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            { tk: tk.trim() },
            { email: email.trim() }
          ]
        }
      });

      if (existedUser) {
        return res.send("Tài khoản hoặc email đã tồn tại ở user khác");
      }

      await User.update(
        {
          tk: tk.trim(),
          email: email.trim(),
          mk: mk,
          role: role
        },
        {
          where: { id: id }
        }
      );

      return res.redirect("/admin/users");
    } catch (error) {
      console.log("updateUser error =", error);
      return res.status(500).send("Lỗi cập nhật tài khoản");
    }
  },

  deleteUser: async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Bạn không có quyền");
      }

      const id = req.params.id;

      await User.destroy({
        where: { id: id }
      });

      return res.redirect("/admin/users");
    } catch (error) {
      console.log("deleteUser error =", error);
      return res.status(500).send("Lỗi xóa tài khoản");
    }
  }
};
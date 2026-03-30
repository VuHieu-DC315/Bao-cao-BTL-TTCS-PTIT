require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));

app.use(cors());
app.options("*", cors());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

const db = require("./models");
const User = db.users;
const Op = db.Sequelize.Op;
const cartRouter = require("./routes/cart.router");
const announcementRouter = require("./routes/announcement.router");

const renderView = (res, viewName, data = {}) => {
  return res.render(viewName, data, (err, html) => {
    if (err) {
      const fallbackPath = path.join(__dirname, viewName);
      return res.render(fallbackPath, data);
    }
    return res.send(html);
  });
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

db.sequelize
  .sync()
  .then(() => {
    console.log("Synced database.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

app.get("/", (req, res) => {
  renderView(res, "home.ejs");
});

app.get("/login", (req, res) => {
  renderView(res, "login.ejs", {
    error: req.query.error || "",
    success: req.query.success || "",
  });
});

app.post("/login", async (req, res) => {
  try {
    const { tk, mk } = req.body;

    const user = await User.findOne({
      where: {
        tk: tk,
        mk: mk,
      },
    });

    if (!user) {
      return renderView(res, "login.ejs", {
        error: "Sai tài khoản hoặc mật khẩu",
        success: "",
      });
    }

    req.session.user = {
      id: user.id,
      tk: user.tk,
      email: user.email,
      role: user.role,
    };

    if (user.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/shop");
    }
  } catch (error) {
    console.log("Login error:", error);
    return res.status(500).send("Lỗi server");
  }
});

app.get("/register", (req, res) => {
  renderView(res, "register.ejs", {
    error: "",
  });
});

app.post("/register", async (req, res) => {
  try {
    const { tk, email, mk, confirmMk } = req.body;

    if (!tk || !email || !mk || !confirmMk) {
      return renderView(res, "register.ejs", {
        error: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    if (tk.trim().length < 3) {
      return renderView(res, "register.ejs", {
        error: "Tài khoản phải có ít nhất 3 ký tự",
      });
    }

    if (!isValidEmail(email)) {
      return renderView(res, "register.ejs", {
        error: "Email không đúng định dạng",
      });
    }

    if (mk.length < 6) {
      return renderView(res, "register.ejs", {
        error: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    if (mk !== confirmMk) {
      return renderView(res, "register.ejs", {
        error: "Mật khẩu nhập lại không khớp",
      });
    }

    const existedUser = await User.findOne({
      where: {
        [Op.or]: [{ tk: tk.trim() }, { email: email.trim() }],
      },
    });

    if (existedUser) {
      if (existedUser.tk === tk.trim()) {
        return renderView(res, "register.ejs", {
          error: "Tài khoản đã tồn tại",
        });
      }

      return renderView(res, "register.ejs", {
        error: "Email đã được sử dụng",
      });
    }

    await User.create({
      tk: tk.trim(),
      email: email.trim(),
      mk: mk,
      role: "user",
    });

    return res.redirect(
      "/login?success=" +
        encodeURIComponent("Đăng ký thành công, hãy đăng nhập"),
    );
  } catch (error) {
    console.log("Register error:", error);
    return res.status(500).send("Lỗi server khi đăng ký");
  }
});

app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Bạn không có quyền vào trang admin");
  }

  return renderView(res, "admin.ejs");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

require("./routes/tutorial.routes")(app);
require("./routes/tutorial.api")(app);
require("./routes/user.routes")(app);
app.use("/cart", cartRouter);
app.use("/announcements", announcementRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
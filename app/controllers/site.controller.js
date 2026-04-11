const path = require('path');
const db = require('../models');

const User = db.users;
const Tutorial = db.tutorials;
const Announcement = db.announcements;
const PasswordResetRequest = db.passwordResetRequests;
const Op = db.Sequelize.Op;
const Sequelize = db.Sequelize;

function renderView(res, viewName, data = {}) {
  return res.render(viewName, data, (err, html) => {
    if (err) {
      const fallbackPath = path.join(__dirname, '../views', viewName);
      return res.render(fallbackPath, data);
    }
    return res.send(html);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatVN(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
}

async function getHomePage(req, res) {
  try {
    const now = new Date();

    const tutorials = await Tutorial.findAll({
      order: [['id', 'DESC']],
      limit: 6,
    });

    const announcements = await Announcement.findAll({
      where: {
        [Sequelize.Op.or]: [
          { isPermanent: true },
          {
            [Sequelize.Op.and]: [
              {
                [Sequelize.Op.or]: [
                  { startDate: null },
                  { startDate: { [Sequelize.Op.lte]: now } },
                ],
              },
              {
                [Sequelize.Op.or]: [
                  { endDate: null },
                  { endDate: { [Sequelize.Op.gte]: now } },
                ],
              },
            ],
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    const uniqueAnnouncements = [];
    const seenIds = new Set();

    for (const item of announcements) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueAnnouncements.push(item);
      }
    }

    const formattedAnnouncements = uniqueAnnouncements.map((item) => ({
      ...item.toJSON(),
      startDateVN: item.startDate ? formatVN(item.startDate) : null,
      endDateVN: item.endDate ? formatVN(item.endDate) : null,
    }));

    return renderView(res, 'home', {
      user: req.session.user || null,
      announcements: formattedAnnouncements.slice(0, 3),
      hasMoreAnnouncements: formattedAnnouncements.length > 3,
      tutorials,
    });
  } catch (error) {
    console.log('Home render error:', error);
    return res.status(500).send('Lỗi render trang chủ');
  }
}

function getLoginPage(req, res) {
  return renderView(res, 'login.ejs', {
    error: req.query.error || '',
    success: req.query.success || '',
  });
}

async function login(req, res) {
  try {
    const { tk, mk } = req.body;

    const user = await User.findOne({
      where: { tk, mk },
    });

    if (!user) {
      return renderView(res, 'login.ejs', {
        error: 'Sai tài khoản hoặc mật khẩu',
        success: '',
      });
    }

    req.session.user = {
      id: user.id,
      tk: user.tk,
      email: user.email,
      role: user.role,
    };

    if (user.role === 'admin') {
      return res.redirect('/admin');
    }

    return res.redirect('/shop');
  } catch (error) {
    console.log('Login error:', error);
    return res.status(500).send('Lỗi server');
  }
}

function getRegisterPage(req, res) {
  return renderView(res, 'register.ejs', {
    error: '',
  });
}

async function register(req, res) {
  try {
    const { tk, email, mk, confirmMk } = req.body;

    if (!tk || !email || !mk || !confirmMk) {
      return renderView(res, 'register.ejs', {
        error: 'Vui lòng nhập đầy đủ thông tin',
      });
    }

    if (tk.trim().length < 3) {
      return renderView(res, 'register.ejs', {
        error: 'Tài khoản phải có ít nhất 3 ký tự',
      });
    }

    if (!isValidEmail(email)) {
      return renderView(res, 'register.ejs', {
        error: 'Email không đúng định dạng',
      });
    }

    if (mk.length < 6) {
      return renderView(res, 'register.ejs', {
        error: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    if (mk !== confirmMk) {
      return renderView(res, 'register.ejs', {
        error: 'Mật khẩu nhập lại không khớp',
      });
    }

    const existedUser = await User.findOne({
      where: {
        [Op.or]: [{ tk: tk.trim() }, { email: email.trim() }],
      },
    });

    if (existedUser) {
      if (existedUser.tk === tk.trim()) {
        return renderView(res, 'register.ejs', {
          error: 'Tài khoản đã tồn tại',
        });
      }

      return renderView(res, 'register.ejs', {
        error: 'Email đã được sử dụng',
      });
    }

    await User.create({
      tk: tk.trim(),
      email: email.trim(),
      mk,
      role: 'user',
    });

    return res.redirect('/login?success=' + encodeURIComponent('Đăng ký thành công, hãy đăng nhập'));
  } catch (error) {
    console.log('Register error:', error);
    return res.status(500).send('Lỗi server khi đăng ký');
  }
}

function getForgotPasswordPage(req, res) {
  return renderView(res, 'forgotPassword.ejs', {
    error: '',
    success: '',
  });
}

async function forgotPassword(req, res) {
  try {
    const { tk, email } = req.body;

    if (!tk || !email) {
      return renderView(res, 'forgotPassword.ejs', {
        error: 'Vui lòng nhập đầy đủ tài khoản và email',
        success: '',
      });
    }

    const user = await User.findOne({
      where: {
        tk: tk.trim(),
        email: email.trim(),
      },
    });

    if (!user) {
      return renderView(res, 'forgotPassword.ejs', {
        error: 'Tài khoản và email không khớp',
        success: '',
      });
    }

    const existedPending = await PasswordResetRequest.findOne({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    if (existedPending) {
      return renderView(res, 'forgotPassword.ejs', {
        error: 'Bạn đã gửi yêu cầu trước đó, vui lòng chờ admin xử lý',
        success: '',
      });
    }

    await PasswordResetRequest.create({
      userId: user.id,
      tk: user.tk,
      email: user.email,
      status: 'pending',
    });

    return renderView(res, 'forgotPassword.ejs', {
      error: '',
      success: 'Đã gửi yêu cầu mật khẩu mới. Vui lòng chờ admin xử lý.',
    });
  } catch (error) {
    console.log('Forgot password error:', error);
    return res.status(500).send('Lỗi xử lý quên mật khẩu');
  }
}

function getAdminPage(req, res) {
  return renderView(res, 'admin.ejs');
}

function logout(req, res) {
  delete req.session.user;

  req.session.save((err) => {
    if (err) {
      console.log('Logout session save error:', err);
      return res.redirect('/login');
    }

    return res.redirect('/login');
  });
}

module.exports = {
  getHomePage,
  getLoginPage,
  login,
  getRegisterPage,
  register,
  getForgotPasswordPage,
  forgotPassword,
  getAdminPage,
  logout,
};
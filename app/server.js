require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const db = require('./models');

const cartRouter = require('./routes/cart.router');
const announcementRouter = require('./routes/announcement.router');
const voucherRouter = require('./routes/voucher.routes');
const siteRouter = require('./routes/site.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './public')));

app.use(cors());
app.options('*', cors());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected.");
    return db.sequelize.sync();
  })
  .then(() => {
    console.log("Synced database.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

app.use('/', siteRouter);
require('./routes/tutorial.routes')(app);
require('./routes/tutorial.api')(app);
require('./routes/user.routes')(app);
app.use('/cart', cartRouter);
app.use('/announcements', announcementRouter);
app.use('/admin/vouchers', voucherRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
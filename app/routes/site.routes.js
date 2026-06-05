const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

router.get('/', siteController.getHomePage);

router.get('/login', siteController.getLoginPage);
router.post('/login', siteController.login);

router.get('/register', siteController.getRegisterPage);
router.post('/register', siteController.register);

router.get('/forgot-password', siteController.getForgotPasswordPage);
router.post('/forgot-password', siteController.forgotPassword);

router.get('/admin', requireAdmin, siteController.getAdminPage);
router.get('/logout', siteController.logout);

module.exports = router;
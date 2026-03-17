const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

router.get("/", checkLogin, cartController.getCartPage);
router.post("/add", checkLogin, cartController.addToCart);
router.post("/update", checkLogin, cartController.updateQuantity);
router.post("/remove", checkLogin, cartController.removeItem);
router.post("/checkout", checkLogin, cartController.checkoutCart);

module.exports = router;
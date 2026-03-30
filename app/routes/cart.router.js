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
router.post("/items", checkLogin, cartController.addToCart);
router.post("/items/update", checkLogin, cartController.updateQuantity);
router.post("/items/delete", checkLogin, cartController.removeItem);
router.post("/checkout", checkLogin, cartController.checkoutCart);

module.exports = router;
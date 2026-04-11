const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

router.get("/", cartController.getCartPage);
router.post("/items", cartController.addToCart);
router.post("/items/update", cartController.updateQuantity);
router.post("/items/delete", cartController.removeItem);
router.post("/checkout", cartController.checkoutCart);

module.exports = router;
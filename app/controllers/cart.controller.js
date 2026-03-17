const db = require("../models");
const Cart = db.carts;
const CartItem = db.cartItems;
const Tutorial = db.tutorials;

module.exports = {
  addToCart: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const tutorialId = req.body.tutorialId;

      let cart = await Cart.findOne({
        where: { userId }
      });

      if (!cart) {
        cart = await Cart.create({ userId });
      }

      let item = await CartItem.findOne({
        where: {
          cartId: cart.id,
          tutorialId: tutorialId
        }
      });

      if (item) {
        item.quantity = item.quantity + 1;
        await item.save();
      } else {
        await CartItem.create({
          cartId: cart.id,
          tutorialId: tutorialId,
          quantity: 1
        });
      }

      return res.redirect("/cart");
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi thêm vào giỏ hàng");
    }
  },

  getCartPage: async (req, res) => {
    try {
      const userId = req.session.user.id;

      let cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            include: [Tutorial]
          }
        ]
      });

      if (!cart) {
        return res.render("cart.ejs", {
          cartItems: [],
          total: 0
        });
      }

      const cartItems = cart.cart_items || cart.cartItems || [];
      let total = 0;

      cartItems.forEach(item => {
        total += item.quantity * item.tutorial.price;
      });

      return res.render("cart.ejs", {
        cartItems,
        total
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi hiển thị giỏ hàng");
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const itemId = req.body.itemId;
      const quantity = parseInt(req.body.quantity);

      let item = await CartItem.findByPk(itemId);

      if (!item) {
        return res.send("Không tìm thấy sản phẩm trong giỏ");
      }

      if (quantity <= 0) {
        await item.destroy();
      } else {
        item.quantity = quantity;
        await item.save();
      }

      return res.redirect("/cart");
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi cập nhật giỏ hàng");
    }
  },

  removeItem: async (req, res) => {
    try {
      const itemId = req.body.itemId;

      let item = await CartItem.findByPk(itemId);

      if (item) {
        await item.destroy();
      }

      return res.redirect("/cart");
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi xóa sản phẩm");
    }
  },

checkoutCart: async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        message: "Vui lòng nhập email và số điện thoại"
      });
    }

    let cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [Tutorial]
        }
      ]
    });

    if (!cart) {
      return res.status(400).json({
        message: "Giỏ hàng trống"
      });
    }

    const cartItems = cart.cart_items || cart.cartItems || [];

    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "Giỏ hàng trống"
      });
    }

    for (const item of cartItems) {
      await db.orders.create({
        tutorialId: item.tutorial.id,
        title: item.tutorial.title,
        quantity: item.quantity,
        email,
        phone
      });
    }

    await CartItem.destroy({
      where: {
        cartId: cart.id
      }
    });

    return res.json({
      message: "Thanh toán thành công"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Lỗi thanh toán giỏ hàng"
    });
  }
}

};


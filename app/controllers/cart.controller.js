const db = require("../models");
const Cart = db.carts;
const CartItem = db.cartItems;
const Tutorial = db.tutorials;

function parsePositiveInt(value, defaultValue = 1) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

module.exports = {
  addToCart: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const tutorialId = req.body.tutorialId;

      const tutorial = await Tutorial.findByPk(tutorialId);
      if (!tutorial) {
        return res.status(404).send("Sản phẩm không tồn tại");
      }

      if (!tutorial.published || tutorial.quantity <= 0) {
        return res.status(400).send("Sản phẩm đã hết hàng hoặc ngừng bán");
      }

      let cart = await Cart.findOne({ where: { userId } });
      if (!cart) {
        cart = await Cart.create({ userId });
      }

      let item = await CartItem.findOne({
        where: {
          cartId: cart.id,
          tutorialId,
        },
      });

      if (item) {
        if (item.quantity + 1 > tutorial.quantity) {
          return res
            .status(400)
            .send("Số lượng trong giỏ đã đạt tối đa tồn kho");
        }

        item.quantity += 1;
        await item.save();
      } else {
        await CartItem.create({
          cartId: cart.id,
          tutorialId,
          quantity: 1,
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

      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            as: "items",
            include: [
              {
                model: Tutorial,
                as: "tutorial",
              },
            ],
          },
        ],
      });

      if (!cart) {
        return res.render("cart.ejs", {
          cartItems: [],
          total: 0,
        });
      }

      const cartItems = cart.items || [];
      let total = 0;

      cartItems.forEach((item) => {
        total += item.quantity * (item.tutorial?.price || 0);
      });

      return res.render("cart.ejs", {
        cartItems,
        total,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi hiển thị giỏ hàng");
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const itemId = req.body.itemId;
      const quantity = parsePositiveInt(req.body.quantity, 1);

      const item = await CartItem.findByPk(itemId);
      if (!item) {
        return res.status(404).send("Không tìm thấy sản phẩm trong giỏ");
      }

      const tutorial = await Tutorial.findByPk(item.tutorialId);
      if (!tutorial) {
        await item.destroy();
        return res.status(404).send("Sản phẩm không còn tồn tại");
      }

      if (!tutorial.published || tutorial.quantity <= 0) {
        await item.destroy();
        return res.status(400).send("Sản phẩm đã hết hàng hoặc ngừng bán");
      }

      if (quantity > tutorial.quantity) {
        return res.status(400).send("Số lượng cập nhật vượt quá tồn kho");
      }

      item.quantity = quantity;
      await item.save();

      return res.redirect("/cart");
    } catch (error) {
      console.log(error);
      return res.status(500).send("Lỗi cập nhật giỏ hàng");
    }
  },

  removeItem: async (req, res) => {
    try {
      const itemId = req.body.itemId;

      const item = await CartItem.findByPk(itemId);
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
    const transaction = await db.sequelize.transaction();

    try {
      const userId = req.session.user.id;
      const { email, phone } = req.body;

      if (!email || !phone) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Vui lòng nhập email và số điện thoại",
        });
      }

      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            as: "items",
            include: [{ model: Tutorial, as: "tutorial" }],
          },
        ],
        transaction,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Giỏ hàng trống",
        });
      }

      for (const item of cart.items) {
        const tutorial = await Tutorial.findByPk(item.tutorialId, {
          transaction,
        });

        if (!tutorial) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Sản phẩm trong giỏ không còn tồn tại (ID: ${item.tutorialId})`,
          });
        }

        if (!tutorial.published || tutorial.quantity <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: `${tutorial.title} đã hết hàng hoặc ngừng bán`,
          });
        }

        if (item.quantity > tutorial.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            message: `${tutorial.title} không đủ tồn kho`,
          });
        }
      }

      for (const item of cart.items) {
        const tutorial = await Tutorial.findByPk(item.tutorialId, {
          transaction,
        });

        await db.orders.create(
          {
            tutorialId: tutorial.id,
            userId,
            title: tutorial.title,
            quantity: item.quantity,
            email,
            phone,
            price: tutorial.price,
            status: "pending",
          },
          { transaction },
        );

        tutorial.quantity = tutorial.quantity - item.quantity;
        if (tutorial.quantity <= 0) {
          tutorial.quantity = 0;
          tutorial.published = false;
        }
        await tutorial.save({ transaction });
      }

      await CartItem.destroy({
        where: {
          cartId: cart.id,
        },
        transaction,
      });

      await transaction.commit();

      return res.json({
        message: "Thanh toán thành công",
      });
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      return res.status(500).json({
        message: "Lỗi thanh toán giỏ hàng",
      });
    }
  },
};

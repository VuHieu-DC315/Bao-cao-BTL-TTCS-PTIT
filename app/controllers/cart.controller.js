const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Voucher = db.vouchers;

const {
  normalizeVoucherCode,
  isVoucherInTime,
  calculateDiscount,
} = require("../utils/voucher");

function parsePositiveInt(value, defaultValue = 1) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function getTempCart(req) {
  if (!Array.isArray(req.session.tempCart)) {
    req.session.tempCart = [];
  }
  return req.session.tempCart;
}

function saveTempCart(req, items) {
  req.session.tempCart = items;
  return req.session.tempCart;
}

function getGuestOrderIds(req) {
  if (!Array.isArray(req.session.guestOrderIds)) {
    req.session.guestOrderIds = [];
  }
  return req.session.guestOrderIds;
}

function addGuestOrderId(req, orderId) {
  const guestOrderIds = getGuestOrderIds(req);
  if (!guestOrderIds.includes(orderId)) {
    guestOrderIds.unshift(orderId);
  }
  req.session.guestOrderIds = guestOrderIds;
}

module.exports = {
  addToCart: async (req, res) => {
    try {
      const tutorialId = parseInt(req.body.tutorialId, 10);

      if (!Number.isInteger(tutorialId) || tutorialId <= 0) {
        return res.status(400).send("ID sản phẩm không hợp lệ");
      }

      const tutorial = await Tutorial.findByPk(tutorialId);
      if (!tutorial) {
        return res.status(404).send("Sản phẩm không tồn tại");
      }

      if (!tutorial.published || tutorial.quantity <= 0) {
        return res.status(400).send("Sản phẩm đã hết hàng hoặc ngừng bán");
      }

      const cart = getTempCart(req);
      const existingIndex = cart.findIndex(
        (item) => Number(item.tutorialId) === tutorialId,
      );

      if (existingIndex >= 0) {
        const nextQuantity =
          parsePositiveInt(cart[existingIndex].quantity, 1) + 1;

        if (nextQuantity > tutorial.quantity) {
          return res
            .status(400)
            .send("Số lượng trong giỏ đã đạt tối đa tồn kho");
        }

        cart[existingIndex].quantity = nextQuantity;
      } else {
        cart.push({
          tutorialId,
          quantity: 1,
        });
      }

      saveTempCart(req, cart);
      return res.redirect("/cart");
    } catch (error) {
      console.log("addToCart error =", error);
      return res.status(500).send("Lỗi thêm vào giỏ hàng");
    }
  },

  getCartPage: async (req, res) => {
    try {
      const sessionCart = getTempCart(req);

      if (sessionCart.length === 0) {
        return res.render("cart.ejs", {
          cartItems: [],
          total: 0,
          user: req.session.user || null,
          availableVouchers: [],
        });
      }

      const tutorialIds = sessionCart
        .map((item) => parseInt(item.tutorialId, 10))
        .filter((id) => Number.isInteger(id) && id > 0);

      const tutorials = await Tutorial.findAll({
        where: {
          id: tutorialIds,
        },
      });

      const tutorialMap = new Map();
      tutorials.forEach((tutorial) => {
        tutorialMap.set(Number(tutorial.id), tutorial);
      });

      const cartItems = [];
      let total = 0;

      for (const rawItem of sessionCart) {
        const tutorialId = parseInt(rawItem.tutorialId, 10);
        const tutorial = tutorialMap.get(tutorialId);

        if (!tutorial) {
          continue;
        }

        if (!tutorial.published || tutorial.quantity <= 0) {
          continue;
        }

        const quantity = Math.min(
          parsePositiveInt(rawItem.quantity, 1),
          tutorial.quantity,
        );

        const lineTotal = quantity * Number(tutorial.price || 0);

        cartItems.push({
          id: tutorial.id,
          tutorialId: tutorial.id,
          quantity,
          tutorial,
          lineTotal,
        });

        total += lineTotal;
      }

      saveTempCart(
        req,
        cartItems.map((item) => ({
          tutorialId: item.tutorialId,
          quantity: item.quantity,
        })),
      );

      let availableVouchers = [];

      if (req.session.user && cartItems.length > 0) {
        const cartTutorialIds = cartItems.map((item) => Number(item.tutorialId));

        const rawVouchers = await Voucher.findAll({
          where: {
            isActive: true,
            [db.Sequelize.Op.or]: [
              { appliesTo: "all" },
              { appliesTo: "product", tutorialId: cartTutorialIds },
              { appliesTo: "tutorial", tutorialId: cartTutorialIds },
            ],
          },
          order: [["id", "DESC"]],
        });

        const now = new Date();

        availableVouchers = rawVouchers.filter((voucher) => {
          const inTime =
            (!voucher.startDate || new Date(voucher.startDate) <= now) &&
            (!voucher.endDate || new Date(voucher.endDate) >= now);

          const stillAvailable =
            Number(voucher.usedCount || 0) < Number(voucher.quantity || 0);

          if (!inTime || !stillAvailable) {
            return false;
          }

          const appliesToProduct =
            voucher.appliesTo === "product" || voucher.appliesTo === "tutorial";

          if (appliesToProduct) {
            const targetItem = cartItems.find(
              (item) => Number(item.tutorialId) === Number(voucher.tutorialId),
            );

            if (!targetItem) {
              return false;
            }

            return targetItem.lineTotal >= Number(voucher.minOrderTotal || 0);
          }

          return total >= Number(voucher.minOrderTotal || 0);
        });
      }

      return res.render("cart.ejs", {
        cartItems,
        total,
        user: req.session.user || null,
        availableVouchers,
      });
    } catch (error) {
      console.log("getCartPage error =", error);
      return res.status(500).send("Lỗi hiển thị giỏ hàng");
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const tutorialId = parseInt(req.body.itemId, 10);
      const quantity = parsePositiveInt(req.body.quantity, 1);

      if (!Number.isInteger(tutorialId) || tutorialId <= 0) {
        return res.status(400).send("Sản phẩm trong giỏ không hợp lệ");
      }

      const tutorial = await Tutorial.findByPk(tutorialId);
      if (!tutorial) {
        return res.status(404).send("Sản phẩm không còn tồn tại");
      }

      if (!tutorial.published || tutorial.quantity <= 0) {
        return res.status(400).send("Sản phẩm đã hết hàng hoặc ngừng bán");
      }

      if (quantity > tutorial.quantity) {
        return res.status(400).send("Số lượng cập nhật vượt quá tồn kho");
      }

      const cart = getTempCart(req);
      const existingIndex = cart.findIndex(
        (item) => Number(item.tutorialId) === tutorialId,
      );

      if (existingIndex === -1) {
        return res.status(404).send("Không tìm thấy sản phẩm trong giỏ");
      }

      cart[existingIndex].quantity = quantity;
      saveTempCart(req, cart);

      return res.redirect("/cart");
    } catch (error) {
      console.log("updateQuantity error =", error);
      return res.status(500).send("Lỗi cập nhật giỏ hàng");
    }
  },

  removeItem: async (req, res) => {
    try {
      const tutorialId = parseInt(req.body.itemId, 10);

      const cart = getTempCart(req).filter(
        (item) => Number(item.tutorialId) !== tutorialId,
      );

      saveTempCart(req, cart);
      return res.redirect("/cart");
    } catch (error) {
      console.log("removeItem error =", error);
      return res.status(500).send("Lỗi xóa sản phẩm");
    }
  },

  checkoutCart: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const email = String(req.body.email || "").trim();
      const phone = String(req.body.phone || "").trim();
      const voucherCode = normalizeVoucherCode(req.body.voucherCode);
      const sessionCart = getTempCart(req);
      const createdGuestOrderIds = [];

      if (!email || !phone) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Vui lòng nhập email và số điện thoại",
        });
      }

      if (!sessionCart.length) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Giỏ hàng trống",
        });
      }

      const cartItems = [];
      let cartTotal = 0;

      for (const item of sessionCart) {
        const tutorialId = parseInt(item.tutorialId, 10);
        const quantity = parsePositiveInt(item.quantity, 1);

        const tutorial = await Tutorial.findByPk(tutorialId, { transaction });

        if (!tutorial) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Sản phẩm không còn tồn tại (ID: ${tutorialId})`,
          });
        }

        if (!tutorial.published || Number(tutorial.quantity || 0) <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: `${tutorial.title} đã hết hàng hoặc ngừng bán`,
          });
        }

        if (quantity > Number(tutorial.quantity || 0)) {
          await transaction.rollback();
          return res.status(400).json({
            message: `${tutorial.title} không đủ tồn kho`,
          });
        }

        const lineTotal = quantity * Number(tutorial.price || 0);

        cartItems.push({
          tutorial,
          quantity,
          lineTotal,
        });

        cartTotal += lineTotal;
      }

      let totalVoucherDiscount = 0;
      const rowDiscounts = new Array(cartItems.length).fill(0);

      if (voucherCode) {
        if (!req.session.user) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Bạn cần đăng nhập để dùng voucher",
          });
        }

        const voucher = await Voucher.findOne({
          where: { code: voucherCode },
          transaction,
        });

        if (!voucher) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Voucher không tồn tại",
          });
        }

        if (!voucher.isActive) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Voucher đã bị khóa",
          });
        }

        if (!isVoucherInTime(voucher)) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Voucher không còn hiệu lực",
          });
        }

        if (Number(voucher.usedCount || 0) >= Number(voucher.quantity || 0)) {
          await transaction.rollback();
          return res.status(400).json({
            message: "Voucher đã hết lượt sử dụng",
          });
        }

        const appliesToProduct =
          voucher.appliesTo === "product" || voucher.appliesTo === "tutorial";

        if (appliesToProduct) {
          const targetIndex = cartItems.findIndex(
            (item) => Number(item.tutorial.id) === Number(voucher.tutorialId),
          );

          if (targetIndex === -1) {
            await transaction.rollback();
            return res.status(400).json({
              message: "Voucher không áp dụng cho sản phẩm nào trong giỏ hàng",
            });
          }

          const targetLineTotal = cartItems[targetIndex].lineTotal;

          if (targetLineTotal < Number(voucher.minOrderTotal || 0)) {
            await transaction.rollback();
            return res.status(400).json({
              message: "Đơn hàng chưa đủ giá trị tối thiểu",
            });
          }

          totalVoucherDiscount = calculateDiscount({
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            maxDiscount: voucher.maxDiscount,
            baseAmount: targetLineTotal,
          });

          totalVoucherDiscount = Math.min(totalVoucherDiscount, targetLineTotal);
          rowDiscounts[targetIndex] = totalVoucherDiscount;
        } else {
          if (cartTotal < Number(voucher.minOrderTotal || 0)) {
            await transaction.rollback();
            return res.status(400).json({
              message: "Đơn hàng chưa đủ giá trị tối thiểu",
            });
          }

          totalVoucherDiscount = calculateDiscount({
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            maxDiscount: voucher.maxDiscount,
            baseAmount: cartTotal,
          });

          totalVoucherDiscount = Math.min(totalVoucherDiscount, cartTotal);

          let assignedDiscount = 0;

          for (let i = 0; i < cartItems.length; i++) {
            const isLastRow = i === cartItems.length - 1;

            if (isLastRow) {
              rowDiscounts[i] = totalVoucherDiscount - assignedDiscount;
            } else {
              rowDiscounts[i] = Math.floor(
                (totalVoucherDiscount * cartItems[i].lineTotal) / cartTotal,
              );
              assignedDiscount += rowDiscounts[i];
            }
          }
        }

        voucher.usedCount = Number(voucher.usedCount || 0) + 1;
        await voucher.save({ transaction });
      }

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const tutorial = item.tutorial;
        const quantity = item.quantity;
        const lineTotal = item.lineTotal;
        const rowDiscount = Number(rowDiscounts[i] || 0);
        const finalAmount = Math.max(0, lineTotal - rowDiscount);

        const createdOrder = await Order.create(
          {
            tutorialId: tutorial.id,
            userId: req.session.user ? req.session.user.id : null,
            title: tutorial.title,
            quantity,
            email,
            phone,
            price: tutorial.price || 0,
            originalAmount: lineTotal,
            voucherCode: voucherCode || null,
            voucherDiscount: rowDiscount,
            finalAmount,
            status: "pending",
          },
          { transaction },
        );

        if (!req.session.user) {
          createdGuestOrderIds.push(createdOrder.id);
        }

        tutorial.quantity = Number(tutorial.quantity || 0) - quantity;

        if (tutorial.quantity <= 0) {
          tutorial.quantity = 0;
          tutorial.published = false;
        }

        await tutorial.save({ transaction });
      }

      await transaction.commit();

      saveTempCart(req, []);

      if (!req.session.user) {
        createdGuestOrderIds.forEach((orderId) => addGuestOrderId(req, orderId));
      }

      return res.json({
        message: "Thanh toán thành công",
      });
    } catch (error) {
      await transaction.rollback();
      console.log("checkoutCart error =", error);
      return res.status(500).json({
        message: "Lỗi thanh toán giỏ hàng",
      });
    }
  },
};
const db = require("../models");
const Tutorial = db.tutorials;
const Order = db.orders;
const Op = db.Sequelize.Op;

module.exports = {
  getAll: async (req, res) => {
    let tutorials = await Tutorial.findAll();
    return res.render('tutorial.ejs', { tutorials })
  },
  // Create and Save a new Tutorial
  create: async (req, res) => {
    // Validate request
    // if (!req.body.title) {
    //   res.status(400).send({
    //     message: "Content can not be empty!"
    //   });
    //   return;
    // }

    // Create a Tutorial
    const tutorial = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      published: req.body.published ? req.body.published : false
    };

    // Save Tutorial in the database
    await Tutorial.create(tutorial);
    return res.redirect('/tutorials')

  },

  // go to  Main sales page
  getHomesalePage: async (req, res) => {
    let tutorials = await Tutorial.findAll();
    return res.render('homepage.ejs', { tutorials })
  },

  getBuyPage: async (req, res) => {
    try {
      const id = req.params.id;
      const tutorial = await Tutorial.findByPk(id);

      if (!tutorial) {
        return res.status(404).send(`Cannot find tutorial with id=${id}`);
      }

      return res.render("buypage.ejs", { tutorial });
    } catch (error) {
      return res.status(500).send("Server error");
    }
  },

  buyTutorial: async (req, res) => {
  try {
    console.log("req.body =", req.body);

    const { tutorialId, title, quantity, email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        message: "Vui lòng nhập email và số điện thoại"
      });
    }

    const order = await Order.create({
      tutorialId,
      title,
      quantity,
      email,
      phone
    });

    return res.json({
      message: "Buy success",
      order
    });
  } catch (error) {
    console.log("buyTutorial error =", error);
    return res.status(500).json({
      message: "Error when buying tutorial"
    });
  }
},

  getCreate: (req, res) => {
    return res.render('create.ejs')
  },

  // Find a single Tutorial with an id
  findOne: (req, res) => {
    const id = req.params.id;

    Tutorial.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Tutorial with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Tutorial with id=" + id
        });
      });
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.findAll();

      return res.render("order.ejs", {
        orders: orders
      });
    } catch (error) {
      console.log("getAllOrders error =", error);
      return res.status(500).send("Lỗi khi lấy danh sách orders");
    }
  },

  // Update a Tutorial by the id in the request
  update: (req, res) => {
    const id = req.params.id;

    Tutorial.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Tutorial was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Tutorial with id=" + id
        });
      });
  }
}


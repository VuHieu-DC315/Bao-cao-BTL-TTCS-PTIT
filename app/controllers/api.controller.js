const db = require("../models");
const Tutorial = db.tutorials;
const Op = db.Sequelize.Op;

function parseNonNegativeInt(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function parsePublishedValue(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1" ||
    value === "on"
  );
}

// Create and Save a new Tutorial
exports.create = (req, res) => {
  if (!req.body.title) {
    res.status(400).send({
      message: "Tutorial's title can not be empty!",
    });
    return;
  }

  const quantity = parseNonNegativeInt(req.body.quantity, 0);
  const price = parseNonNegativeInt(req.body.price, 0);

  const tutorial = {
    title: req.body.title,
    description: req.body.description,
    price,
    quantity,
    published: parsePublishedValue(req.body.published) && quantity > 0,
  };

  Tutorial.create(tutorial)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Tutorial.",
      });
    });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  const condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

  Tutorial.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Tutorial.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Tutorial with id=${id}.`,
        });
      }
    })
    .catch(() => {
      res.status(500).send({
        message: "Error retrieving Tutorial with id=" + id,
      });
    });
};

// Update a Tutorial by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const quantity = parseNonNegativeInt(req.body.quantity, 0);

    const dataToUpdate = {
      title: req.body.title,
      description: req.body.description,
      quantity,
      published: parsePublishedValue(req.body.published) && quantity > 0,
    };

    if (req.body.price !== undefined) {
      dataToUpdate.price = parseNonNegativeInt(req.body.price, 0);
    }

    const [updatedRows] = await Tutorial.update(dataToUpdate, {
      where: { id },
    });

    if (updatedRows === 1) {
      return res.send({
        message: "Tutorial was updated successfully.",
      });
    }

    return res.send({
      message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`,
    });
  } catch (err) {
    return res.status(500).send({
      message: "Error updating Tutorial with id=" + req.params.id,
    });
  }
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Tutorial.destroy({
    where: { id },
  })
    .then((num) => {
      if (num === 1) {
        res.send({
          message: "Tutorial was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Tutorial with id=${id}. Maybe Tutorial was not found!`,
        });
      }
    })
    .catch(() => {
      res.status(500).send({
        message: "Could not delete Tutorial with id=" + id,
      });
    });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  Tutorial.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Tutorials were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all tutorials.",
      });
    });
};

// find all published Tutorial
exports.findAllPublished = (req, res) => {
  Tutorial.findAll({
    where: {
      published: true,
      quantity: {
        [Op.gt]: 0,
      },
    },
  })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};

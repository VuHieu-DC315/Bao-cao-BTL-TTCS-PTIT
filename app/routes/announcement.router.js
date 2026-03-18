const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");

router.get("/", announcementController.getAllPublic);
router.get("/admin", announcementController.getAllAdmin);
router.post("/create", announcementController.create);

module.exports = router;
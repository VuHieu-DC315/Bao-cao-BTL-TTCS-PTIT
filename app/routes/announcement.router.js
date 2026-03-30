const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");

// Public
router.get("/", announcementController.getAllPublic);

// Admin
router.get("/admin/announcements", announcementController.getAllAdmin);
router.post("/admin/announcements", announcementController.create);

module.exports = router;
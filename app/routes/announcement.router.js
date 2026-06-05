const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");

// Public
router.get("/", announcementController.getAllPublic);

// Admin
router.get("/admin/announcements", announcementController.getAllAdmin);
router.post("/admin/announcements", announcementController.create);
router.post("/admin/announcements/:id/delete", announcementController.delete);

module.exports = router;

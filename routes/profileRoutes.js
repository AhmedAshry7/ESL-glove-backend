const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get(
  "/info",
  profileController.getProfileInfo
);

module.exports = router;
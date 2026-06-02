const profileService = require("../services/profileService");

exports.getProfileInfo = async (req, res) => {
  try {
    const { userId } = req.query;
    const profileInfo = await profileService.getProfileInfo(userId);
    res.json(profileInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
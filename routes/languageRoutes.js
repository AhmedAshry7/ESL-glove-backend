const express = require("express");
const router = express.Router();
const languagesController = require("../controllers/languagesController");

router.get("/languageInfo", languagesController.getLanguageInfo);
router.get("/languages", languagesController.getLanguages);
router.post("/addLanguage",languagesController.addLanguage);
router.delete("/:lid", languagesController.deleteLanguage);


module.exports = router;
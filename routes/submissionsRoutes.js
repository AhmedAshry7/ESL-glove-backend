const express = require("express");
const router = express.Router();
const submissionsController = require("../controllers/submissionsController");

router.get("/available",submissionsController.getSubmissionsForModel);
router.get("/language",submissionsController.getSubmissionsForLanguage);
router.get("/download", submissionsController.downloadSubmissions);
router.post('/merge', submissionsController.mergeSubmissions);
router.delete("/:sid", submissionsController.deleteSubmission);
router.post("/addSubmission", submissionsController.addSubmission);

module.exports = router;
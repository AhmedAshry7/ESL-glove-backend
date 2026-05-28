const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelsController');

// All paths here are relative to /api/models
router.post('/train', modelController.initializeTrainingSession);
router.post('/fineTune', modelController.fineTune);
router.get('/brief/:modelId', modelController.getModelBrief);
router.get("/models", modelController.getModels);
router.post("/addModel",modelController.addModel);
router.delete("/:mid", modelController.deleteModel);

module.exports = router;
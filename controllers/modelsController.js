const supabase = require('../config/db');
const modelsService = require("../services/modelsService");
const { spawn } = require('child_process');


const path = require('path');

exports.train = async (req, res) => {
    const { absolutePath, modelName, userId } = req.body;
    const base_mid=0;

    if (!absolutePath || !modelName) {
        return res.status(400).json({ error: "Missing path or model name" });
    }

    const scriptPath = path.join(__dirname, '../scripts/train_script.py'); 
    const pythonProcess = spawn('python', [scriptPath, absolutePath, modelName, base_mid, userId || 'guest']);

    let pythonData = "";
    let errorData = "";

    // Capture the JSON string printed by Python
    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    // Capture any actual errors (syntax errors, etc.)
    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    // This triggers when the script finishes
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "Python script failed", details: errorData });
        }

        try {
            // Parse the JSON string we got from Python's print()
            const result = JSON.parse(pythonData);
            
            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            // SUCCESS: Return the directory and verified metadata to the user
            return res.status(200).json({
                message: "Training metadata initialized successfully",
                directory: result.created_in,
                fileName: result.pickle_file,
                savedData: result.verified_metadata // This proves the pickle is correct
            });

        } catch (e) {
            return res.status(500).json({ error: "Could not parse Python output", raw: pythonData });
        }
    });
};

exports.fineTune = async (req, res) => {
    const { absolutePath, modelName, base_mid, userId } = req.body;

    if (!absolutePath || !modelName) {
        return res.status(400).json({ error: "Missing path or model name" });
    }

    const scriptPath = path.join(__dirname, '../scripts/fine_tune_script.py'); 
    const pythonProcess = spawn('python', [scriptPath, absolutePath, modelName, base_mid, userId || 'guest']);

    let pythonData = "";
    let errorData = "";

    // Capture the JSON string printed by Python
    pythonProcess.stdout.on('data', (data) => {
        pythonData += data.toString();
    });

    // Capture any actual errors (syntax errors, etc.)
    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    // This triggers when the script finishes
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "Python script failed", details: errorData });
        }

        try {
            // Parse the JSON string we got from Python's print()
            const result = JSON.parse(pythonData);
            
            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            // SUCCESS: Return the directory and verified metadata to the user
            return res.status(200).json({
                message: "Training metadata initialized successfully",
                directory: result.created_in,
                fileName: result.pickle_file,
                savedData: result.verified_metadata // This proves the pickle is correct
            });

        } catch (e) {
            return res.status(500).json({ error: "Could not parse Python output", raw: pythonData });
        }
    });
};

exports.getModelBrief = async (req, res) => {

  try {
    const { modelId } = req.params;
    const brief = await modelsService.getModelBrief(modelId);
    res.status(200).json(brief);
  } catch (error) {
    console.error("Error in getModelBrief controller:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.addModel = async (req, res) => {
    try {
        const { userId, lid, base_mid, modelName, fileContent } = req.body;
        
        // 1. Enhanced Validation
        // Ensures all required fields exist before moving to the expensive service layer
        if (!modelName || !lid || !fileContent) {
            return res.status(400).json({ 
                error: "Validation Error", 
                message: "Missing required fields: model Name, base Mid, or lid, file." 
            });
        }
        console.log(base_mid);
        const newMid = await modelsService.addModel({  
          userId,
          lid,
          base_mid,
          modelName,
          fileContent
        });

        // 3. Consistent Success Response
        return res.status(200).json({ 
            success: true, 
            message: "Model uploaded successfully", 
            data: { newMid } 
        });
        
    } catch (error) {
        // 4. Consistent Error Reporting
        console.error(`[upload Error]: ${error.message}`);
        
        return res.status(500).json({ 
            error: "Upload operation failed", 
            message: error.message || "An internal server error occurred." 
        });
    }
};


exports.deleteModel = async (req, res) => {
    try {
        const { mid } = req.params; // Changed from 'id' to 'sid' to match route
        const {model_file} =req.body;
        const deleted = await modelsService.deleteModel(mid, model_file);
        if (!deleted) return res.status(404).json({ error: "Model not found" });
        
        res.status(200).json({ message: "Model deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getModels = async (req, res) => {

  try {
    const models = await modelsService.getModels();
    res.json(models);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
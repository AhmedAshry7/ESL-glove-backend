const languagesService = require("../services/languagesService");

exports.getLanguageInfo = async (req, res) => {
  try {
    const { languageId } = req.query;
    const submissions = await languagesService.getLanguageInfo(languageId);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addLanguage = async (req, res) =>{
  try{
    const {language_name, uid} = req.body;
    if (!language_name || !uid) {
        return res.status(400).json({ 
            error: "Validation Error", 
            message: "Missing required fields: language Name, userId" 
        });
    }
    const newLid = await languagesService.addLanguage(language_name, uid);
    return res.status(200).json({ 
        success: true, 
        message: "Language added successfully", 
        data: { newLid } 
    });
  }catch (error) {
        console.error(`[Adding Language Error]: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};


exports.deleteLanguage = async (req, res) => {
    try {
        const { lid } = req.params;
        const deleted = await languagesService.deleteLanguage(lid);
        if (!deleted) return res.status(404).json({ error: "Language not found" });
        res.status(200).json({ message: "Language deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getLanguages = async (req, res) => {
  try {
    const languages = await languagesService.getLanguages();
    res.json(languages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
const submissionsService = require("../services/submissionsService");
const axios = require("axios");
const archiver = require("archiver");

exports.getSubmissionsForModel = async (req, res) => {
  try {
    const { languageId, modelId } = req.query;
    const submissions = await submissionsService.getAvailableSubmissions(languageId, modelId);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSubmissionsForLanguage = async (req, res) => {
  try {
    const { languageId } = req.query;
    const submissions = await submissionsService.getLanguageSubmissions(languageId);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteSubmission = async (req, res) => {
    try {
        const { sid } = req.params;
        const {readings_file} =req.body;
        const deleted = await submissionsService.deleteSubmission(sid, readings_file);
        if (!deleted) return res.status(404).json({ error: "Submission not found" });
        res.status(200).json({ message: "Submission deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.downloadSubmissions = async (req, res) => {
    try {
        const idsString = req.query.ids;
        if (!idsString) return res.status(400).json({ error: "No IDs provided" });
        const sids = idsString.split(',').map(id => parseInt(id));
        const submissionsToDownload = await submissionsService.getSubmissionsByIds(sids);
        if (!submissionsToDownload || submissionsToDownload.length === 0) {
            return res.status(404).json({ error: "No submissions found" });
        }
        if (submissionsToDownload.length === 1) {
            const singleSub = submissionsToDownload[0];
            const fileUrl = process.env.SUPABASE_STORAGE_URL + singleSub.readings_file;
            const response = await axios.get(fileUrl, { responseType: 'stream' });
            res.setHeader('Content-Disposition', `attachment; filename="${singleSub.submission_name}.json"`);
            res.setHeader('Content-Type', 'application/json');
            
            return response.data.pipe(res);
        }
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Disposition', 'attachment; filename="submissions_batch.zip"');
        res.setHeader('Content-Type', 'application/zip');
        archive.pipe(res);
        for (const singleSub of submissionsToDownload) {
            const fileUrl = process.env.SUPABASE_STORAGE_URL + singleSub.readings_file;
            const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            archive.append(fileResponse.data, { name: `${singleSub.submission_name}_${singleSub.sid}.json` });
        }
        await archive.finalize();
    } catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({ error: "Failed to process download" });
    }
};

exports.mergeSubmissions = async (req, res) => {
    try {
        const { sids, newName, userId, lid } = req.body;
        if (!sids || !Array.isArray(sids) || sids.length < 2) {
            return res.status(400).json({ 
                error: "Selection Error", 
                message: "Please select at least two submissions to merge." 
            });
        }
        if (!newName || !userId || !lid) {
            return res.status(400).json({ 
                error: "Validation Error", 
                message: "Missing required fields: newName, userId, or lid." 
            });
        }
        const integerSids = sids.map(sid => parseInt(sid, 10));
        const newSid = await submissionsService.mergeSubmissionsService({ sids: integerSids, newName, userId, lid});
        return res.status(200).json({ 
            success: true, 
            message: "Submissions merged successfully", 
            data: { newSid } 
        });
    } catch (error) {
        console.error(`[MergeController Error]: ${error.message}`);
        return res.status(500).json({ 
            error: "Merge operation failed", 
            message: error.message || "An internal server error occurred." 
        });
    }
};

exports.addSubmission = async (req, res) => {
    try {
        const { newName, userId, lid, fileContent } = req.body;
        if (!newName || !userId || !lid || !fileContent) {
            return res.status(400).json({ 
                error: "Validation Error", 
                message: "Missing required fields: newName, userId, or lid, fileName." 
            });
        }
        const newSid = await submissionsService.addSubmission({newName, userId, lid, fileContent});
        return res.status(200).json({ 
            success: true, 
            message: "Submissions uploaded successfully", 
            data: { newSid } 
        });
    } catch (error) {
        console.error(`[upload Error]: ${error.message}`);
        return res.status(500).json({ 
            error: "Upload operation failed", 
            message: error.message || "An internal server error occurred." 
        });
    }
};
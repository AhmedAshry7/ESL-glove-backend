const submissionsService = require("../services/submissionsService");
const axios = require("axios");
const archiver = require("archiver");

exports.getSubmissionsForModel = async (req, res) => {

  try {

    const { languageId, modelId } = req.query;

    const submissions =
      await submissionsService.getAvailableSubmissions(languageId, modelId);

    res.json(submissions);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Server error" });

  }
};

exports.getSubmissionsForLanguage = async (req, res) => {

  try {

    const { languageId } = req.query;

    const submissions =
      await submissionsService.getLanguageSubmissions(languageId);

    res.json(submissions);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Server error" });

  }
};

exports.deleteSubmission = async (req, res) => {
    try {
        const { sid } = req.params; // Changed from 'id' to 'sid' to match route
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
        // Expecting IDs as a comma-separated string in query params: ?ids=1,2,3
        const idsString = req.query.ids;
        if (!idsString) return res.status(400).json({ error: "No IDs provided" });

        const sids = idsString.split(',').map(id => parseInt(id));
        const submissions = await submissionsService.getSubmissionsByIds(sids);

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ error: "No submissions found" });
        }

        // SCENARIO 1: Single File Download
        if (submissions.length === 1) {
            const sub = submissions[0];
            const fileUrl = process.env.SUPABASE_STORAGE_URL + sub.readings_file;
            const response = await axios.get(fileUrl, { responseType: 'stream' });
            
            // Explicitly set headers for the browser
            res.setHeader('Content-Disposition', `attachment; filename="${sub.submission_name}.json"`);
            res.setHeader('Content-Type', 'application/json');
            
            return response.data.pipe(res);
        }

        // SCENARIO 2: Multiple Files (ZIP)
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        res.setHeader('Content-Disposition', 'attachment; filename="submissions_batch.zip"');
        res.setHeader('Content-Type', 'application/zip');

        archive.pipe(res);

        for (const sub of submissions) {
            try {
                const fileUrl = process.env.SUPABASE_STORAGE_URL + sub.readings_file;
                const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                // Append file to zip: (data, { name in zip })
                archive.append(fileResponse.data, { name: `${sub.submission_name}_${sub.sid}.json` });
            } catch (err) {
                console.error(`Failed to fetch file for SID ${sub.sid}:`, err.message);
                // Continue to next file even if one fails
            }
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
        
        // 1. Enhanced Validation
        // Ensures all required fields exist before moving to the expensive service layer
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

        // 2. Call Service
        // Convert everything to the correct types immediately
        const numericSids = sids.map(sid => parseInt(sid, 10)); // Force to Integers

        const newSid = await submissionsService.mergeSubmissionsService({ 
            sids: numericSids, 
            newName, 
            userId, 
            lid: lid
        });

        // 3. Consistent Success Response
        return res.status(200).json({ 
            success: true, 
            message: "Submissions merged successfully", 
            data: { newSid } 
        });
        
    } catch (error) {
        // 4. Consistent Error Reporting
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
        
        // 1. Enhanced Validation
        // Ensures all required fields exist before moving to the expensive service layer
        if (!newName || !userId || !lid || !fileContent) {
            return res.status(400).json({ 
                error: "Validation Error", 
                message: "Missing required fields: newName, userId, or lid, fileName." 
            });
        }

        const newSid = await submissionsService.addSubmission({  
            newName, 
            userId, 
            lid,
            fileContent
        });

        // 3. Consistent Success Response
        return res.status(200).json({ 
            success: true, 
            message: "Submissions uploaded successfully", 
            data: { newSid } 
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
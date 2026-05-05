const pool = require("../config/db");
const supabase = require('../config/supabase');
const axios = require('axios');
const { DELETE_SUBMISSION, GET_LANGUAGE_SUBMISSIONS, GET_MULTIPLE_SUBMISSIONS_DETAILS, GET_AVAILABLE_SUBMISSIONS, INSERT_SUBMISSION, ADD_SUBMISSIONS_DATA, ADD_LANGUAGE_SUBMISSIONS, DELETE_DUPLICATES, UPDATE_JUNCTION_DATA, UPDATE_MODEL_LINKS, DELETE_MULTIPLE_SUBMISSIONS } = require("../utils/queries");

exports.getAvailableSubmissions = async (languageId, modelId) => {

  const result = await pool.query(
    GET_AVAILABLE_SUBMISSIONS,
    [languageId, modelId]
  );

  return result.rows;
};

exports.getLanguageSubmissions = async (languageId) => {

  const result = await pool.query(
    GET_LANGUAGE_SUBMISSIONS,
    [languageId]
  );

  return result.rows;
};

exports.deleteSubmission = async (sid, readings_file) => {
    const result = await pool.query(DELETE_SUBMISSION, [sid]);
    const fileName = readings_file.split('/').pop();
    await supabase.storage.from('readings').remove([fileName]);
    return result.rowCount > 0; 
};

exports.getSubmissionsByIds = async (sids) => {
    const result = await pool.query(GET_MULTIPLE_SUBMISSIONS_DETAILS, [sids]);
    return result.rows;
};

exports.createSubmission = async (client, { userId, lid, newName, fileName }) => {
    const result = await client.query(INSERT_SUBMISSION, [userId, lid, newName, fileName]);
    return Number(result.rows[0].sid); 
};

exports.addSubmissionData = async (client, sid, signs) => {
    const insertPromises = signs.map(sign => client.query(ADD_SUBMISSIONS_DATA, [sid, sign]));
    await Promise.all(insertPromises);
}

exports.addLanguageSubmission = async (client, lid, sid) => {
    await client.query(ADD_LANGUAGE_SUBMISSIONS, [lid, sid]);
}

exports.updateJunctionDataSid = async (client, newSid, sids) => {
    await client.query(DELETE_DUPLICATES, [sids]);
    const result = await client.query(UPDATE_JUNCTION_DATA, [newSid, sids]);
    return result.rowCount > 0;
};

exports.migrateModelSubmissions = async (client, newSid, sids) => {
    const result = await client.query(UPDATE_MODEL_LINKS, [newSid, sids]);
    return result.rowCount;
};

exports.deleteSubmissionsBulk = async (client, sids) => {
    const result = await client.query(DELETE_MULTIPLE_SUBMISSIONS, [sids]);
    return result.rowCount > 0;
};

exports.mergeSubmissionsService = async ({ sids, newName, userId, lid }) => {
    const client = await pool.connect();

    try {
        const oldSubs = await exports.getSubmissionsByIds(sids);
        if (oldSubs.length === 0) throw new Error("No submissions found to merge.");
        const cleanSids = sids.map(Number);
        // 2. Parallel Download & Merge
        // Download all files simultaneously instead of one-by-one
        const downloadPromises = oldSubs.map(sub => axios.get(process.env.SUPABASE_STORAGE_URL + sub.readings_file));
        const responses = await Promise.all(downloadPromises);

        let mergedReadings = {};
        let firstMeta = responses[0].data.metadata;
        let totalSigns = 0;

        for (const res of responses) {
            const content = res.data;
            for (const [sign, data] of Object.entries(content.readings)) {
                // If sign already exists, overwrite it (discard duplicate)
                mergedReadings[sign] = data;
            }
        }
        // Count unique signs only
        firstMeta["total_signs"] = Object.keys(mergedReadings).length;
        const newJsonBody = {
            metadata: { ...firstMeta, merged_at: new Date(), sids_included: sids },
            readings: mergedReadings
        };

        // 3. Storage Upload
        const fileName = `merged_${Date.now()}.json`;
        const { error: uploadErr } = await supabase.storage
            .from('readings')
            .upload(fileName, JSON.stringify(newJsonBody), { contentType: 'application/json' });

        if (uploadErr) throw uploadErr;

        // 4. Database Transaction (Using the new consistent Batch 2 functions)
        await client.query('BEGIN');
        const newSid = await exports.createSubmission(client, { userId, lid, newName, fileName });
        await exports.updateJunctionDataSid(client, newSid, cleanSids);
        await exports.migrateModelSubmissions(client, newSid, cleanSids);
        await exports.deleteSubmissionsBulk(client, cleanSids);

        await client.query('COMMIT');

        // 5. Storage Cleanup
        const fileNames = oldSubs.map(s => s.readings_file.split('/').pop());
        await supabase.storage.from('readings').remove(fileNames);

        return newSid;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

exports.addSubmission = async ({ newName, userId, lid, fileContent }) => {
    const client = await pool.connect();

    try {

        // 3. Storage Upload
        const signs = Object.keys(fileContent.readings); // Extract signs (Hi, No, Bye)
        const fileName = `${Date.now()}_${newName.replace(/\s+/g, '_')}.json`;
        const { error: uploadErr } = await supabase.storage
            .from('readings')
            .upload(fileName, JSON.stringify(fileContent), { contentType: 'application/json' });

        if (uploadErr) throw uploadErr;

        // 4. Database Transaction (Using the new consistent Batch 2 functions)
        await client.query('BEGIN');
        const newSid = await exports.createSubmission(client, { userId, lid, newName, fileName });
        await exports.addSubmissionData(client, newSid, signs);
        await exports.addLanguageSubmission(client, lid, newSid);

        await client.query('COMMIT');

        return newSid;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
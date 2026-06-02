const pool = require("../config/db");
const supabase = require('../config/supabase');
const axios = require('axios');
const { GET_MODEL_BRIEF, GET_MODELs, ADD_MODEL, DELETE_MODEL, ADD_MODELs } = require("../utils/queries");

exports.getModelBrief = async (modelId) => {
  const result = await pool.query(GET_MODEL_BRIEF, [modelId]);
  return result.rows;
};

exports.getModels = async (lid) => {
    if (!lid) {
        const result = await pool.query(GET_MODELs);
        return result.rows;
    }
    const result = await pool.query(GET_MODELs, [lid]);
    return result.rows;
};

exports.deleteModel = async (mid, model_file) => {
    const result = await pool.query(DELETE_MODEL, [mid]);
    const fileName = model_file.split('/').pop();
    await supabase.storage.from('models').remove([fileName]);
    return result.rowCount > 0; 
};

exports.addModel = async ({userId, lid, base_mid, modelName, fileContent}) => {
    try {
        const modelFileName = `${Date.now()}_${modelName.replace(/\s+/g, '_')}.pkl`;
        const { error: uploadErr } = await supabase.storage.from('models')
            .upload(modelFileName, fileContent, { contentType: 'application/octet-stream', upsert: false }); //for pkl files

        const result = await pool.query(ADD_MODEL, [userId, Number(lid), base_mid, modelName, modelFileName]);
        return Number(result.rows[0].mid);
    } catch (error) {
        throw error;
    }
};
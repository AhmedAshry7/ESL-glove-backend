const pool = require("../config/db");
const { GET_LANGUAGE_INFO, GET_LANGUAGES, ADD_LANGUAGE , DELETE_LANGUAGE } = require("../utils/queries");

exports.getLanguageInfo = async (languageId) => {
  const result = await pool.query(GET_LANGUAGE_INFO,[languageId]);
  return result.rows;
};

exports.getLanguages = async () => {
  const result = await pool.query(GET_LANGUAGES);
  return result.rows;
};

exports.addLanguage = async (language_name, uid) => {
  const result = await pool.query(ADD_LANGUAGE, [language_name,uid]);
  return result.rows[0].lid;
};

exports.deleteLanguage = async (lid) => {
    const result = await pool.query(DELETE_LANGUAGE, [lid]);
    return result.rowCount > 0; 
};

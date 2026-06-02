const pool = require("../config/db");
const { GET_PROFILE_INFO } = require("../utils/queries");

exports.getProfileInfo = async (userId) => {
  const result = await pool.query(GET_PROFILE_INFO, [userId]);
  return result.rows;
};
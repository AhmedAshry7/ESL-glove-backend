const pool = require('../config/db');
const { CREATE_ROOM, CLOSE_ROOM, GET_ROOM_STATUS } = require('../utils/queries');

exports.createRoom = async (userId, lid) => {
    const { rows } = await pool.query(CREATE_ROOM, [userId, lid]);
    return rows[0].rid;
};

exports.closeRoom = async (roomId, userId) => {
    const result = await pool.query(CLOSE_ROOM, [roomId, userId]);
    return result.rowCount > 0;
};

exports.checkRoomStatus = async (roomId) => {
    const { rows } = await pool.query(GET_ROOM_STATUS, [roomId]);
    return rows[0] || null;
};
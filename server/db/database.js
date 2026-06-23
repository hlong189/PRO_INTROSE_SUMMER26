// server/db/database.js
// Kết nối tới MySQL/MariaDB bằng mysql2 (dùng đúng schema SE_NTII.sql của bạn).

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_NTII',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

// Helper: chạy 1 câu query, trả về rows
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Helper: lấy 1 dòng đầu tiên (hoặc null)
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Helper: chạy trong transaction. callback(conn) -> dùng conn.query(...)
async function transaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('❌ Không kết nối được MySQL:', err.message);
    return false;
  }
}

module.exports = { pool, query, get, transaction, testConnection };

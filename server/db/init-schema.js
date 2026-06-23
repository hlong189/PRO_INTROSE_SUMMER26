// server/db/init-schema.js
// Khởi tạo database từ đúng file SE_NTII.sql của bạn (không chỉnh sửa cấu trúc).
// Chạy: npm run init-db

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sqlPath = path.join(__dirname, 'SE_NTII.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔧 Đang khởi tạo database từ SE_NTII.sql ...');
  try {
    await connection.query(sql);
    console.log('✅ Khởi tạo database thành công (online_NTII).');
  } catch (err) {
    if (/already exists/i.test(err.message)) {
      console.log('ℹ️  Database/bảng đã tồn tại từ trước — bỏ qua phần đã có.');
      console.log('   (Nếu muốn khởi tạo lại từ đầu, hãy DROP DATABASE online_NTII trước.)');
    } else {
      console.error('❌ Lỗi khi khởi tạo database:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await connection.end();
  }
}

main();

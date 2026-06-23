// server/db/reset-db.js
// Xóa sạch database và tạo lại từ đầu — dùng khi gặp lỗi "trống dữ liệu", "không đăng nhập được",
// hoặc muốn làm lại từ đầu cho chắc chắn.
// Chạy: npm run reset-db          (dùng dữ liệu mẫu nhỏ)
//       npm run reset-db -- --real (dùng dataset thật)

require('dotenv').config();
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function dropDatabase() {
  const dbName = process.env.DB_NAME || 'online_NTII';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  console.log(`🗑️  Đang xóa database "${dbName}" (nếu có)...`);
  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await connection.end();
}

async function main() {
  const useReal = process.argv.includes('--real');
  try {
    await dropDatabase();
  } catch (err) {
    console.error('❌ Không kết nối được MySQL để xóa database. Kiểm tra lại file .env (DB_HOST/DB_USER/DB_PASSWORD).');
    console.error('   Chi tiết lỗi:', err.message);
    process.exit(1);
  }

  console.log('🔧 Đang tạo lại database từ SE_NTII.sql...');
  execSync('node server/db/init-schema.js', { stdio: 'inherit' });

  if (useReal) {
    console.log('📥 Đang nhập dataset thật...');
    execSync('node server/db/import-dataset.js', { stdio: 'inherit' });
    console.log('👤 Đang tạo tài khoản demo...');
    execSync('node server/db/ensure-demo-users.js', { stdio: 'inherit' });
  } else {
    console.log('🌱 Đang tạo dữ liệu mẫu...');
    execSync('node server/db/seed.js', { stdio: 'inherit' });
  }

  console.log('\n✅ Hoàn tất! Database đã được tạo lại sạch sẽ. Chạy "npm start" để khởi động server.');
}

main();

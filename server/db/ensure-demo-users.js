// server/db/ensure-demo-users.js
// Dataset thật chứa password_hash giả lập (không phải bcrypt) nên KHÔNG đăng nhập được.
// Script này thêm 2 tài khoản demo dùng được ngay (Admin + Customer), không ảnh hưởng tới dữ liệu đã nhập.
// Hệ thống chỉ dùng 2 phân quyền: Admin và Customer.
// Chạy: npm run ensure-demo-users

const bcrypt = require('bcryptjs');
const { get, all, pool } = require('./database');

async function ensureRole(role_name, description) {
  const existing = await get('SELECT id FROM roles WHERE role_name = ?', [role_name]);
  if (existing) return existing.id;
  const [res] = await pool.query('INSERT INTO roles (role_name, description) VALUES (?, ?)', [role_name, description]);
  return res.insertId;
}

async function ensureUser({ role_id, email, password, full_name, phone }) {
  const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
  const hash = bcrypt.hashSync(password, 10);
  if (existing) {
    await pool.query('UPDATE users SET password_hash = ?, role_id = ?, status = ? WHERE id = ?', [hash, role_id, 'Active', existing.id]);
    return existing.id;
  }
  const [res] = await pool.query(
    'INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
    [role_id, email, hash, full_name, phone || null]
  );
  return res.insertId;
}

async function main() {
  const adminRole = await ensureRole('Admin', 'System administrator with full access');
  const customerRole = await ensureRole('Customer', 'Người mua hàng');

  await ensureUser({ role_id: adminRole, email: 'admin@ntii.vn', password: 'admin123', full_name: 'Quản trị viên' });
  await ensureUser({ role_id: customerRole, email: 'customer@ntii.vn', password: 'customer123', full_name: 'Khách hàng Demo' });

  // Nếu dataset cũ có role Warehouse_Staff -> chuyển toàn bộ user đó thành Customer rồi xóa role này
  const staffRole = await get("SELECT id FROM roles WHERE role_name = 'Warehouse_Staff'");
  if (staffRole) {
    await pool.query('UPDATE users SET role_id = ? WHERE role_id = ?', [customerRole, staffRole.id]);
    await pool.query('DELETE FROM roles WHERE id = ?', [staffRole.id]);
    console.log('ℹ️  Đã gộp các user Warehouse_Staff (nếu có) thành Customer và xóa role này (chỉ giữ 2 phân quyền).');
  }

  console.log('✅ Đã tạo/cập nhật 2 tài khoản demo:');
  console.log('   admin@ntii.vn / admin123');
  console.log('   customer@ntii.vn / customer123');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});

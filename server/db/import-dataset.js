// server/db/import-dataset.js
// Nhập dữ liệu THẬT (file CSV) vào toàn bộ 12 bảng theo đúng thứ tự khóa ngoại.
// Chạy: npm run import-dataset
//
// Các file CSV phải nằm trong server/db/dataset/ với tên đúng như khi bạn export:
//   1_roles.csv, 2_users.csv, 3_suppliers.csv, 4_products.csv, 5_inventory_batches.csv,
//   6_vouchers.csv, 7_orders.csv, 8_order_items.csv, 9_payments.csv, 10_shippings.csv,
//   11_skin_profiles.csv, 12.1_reviews.csv, 12.2_reviews.csv

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool } = require('./database');

const DATASET_DIR = path.join(__dirname, 'dataset');

// Thứ tự bắt buộc để không vi phạm khóa ngoại (bảng cha trước bảng con).
// reviews được nhập làm 2 lượt vì 12.2 có parent_id tham chiếu tới các dòng trong 12.1.
const IMPORT_ORDER = [
  { file: '1_roles.csv', table: 'roles' },
  { file: '2_users.csv', table: 'users' },
  { file: '3_suppliers.csv', table: 'suppliers' },
  { file: '4_products.csv', table: 'products' },
  { file: '5_inventory_batches.csv', table: 'inventory_batches' },
  { file: '6_vouchers.csv', table: 'vouchers' },
  { file: '7_orders.csv', table: 'orders' },
  { file: '8_order_items.csv', table: 'order_items' },
  { file: '9_payments.csv', table: 'payments' },
  { file: '10_shippings.csv', table: 'shippings' },
  { file: '11_skin_profiles.csv', table: 'skin_profiles' },
  { file: '12.1_reviews.csv', table: 'reviews' },
  { file: '12.2_reviews.csv', table: 'reviews' },
];

// Xóa dữ liệu cũ trước khi nhập lại (theo thứ tự ngược để không vướng khóa ngoại)
const TRUNCATE_ORDER = [
  'reviews', 'skin_profiles', 'shippings', 'payments', 'order_items', 'orders',
  'vouchers', 'inventory_batches', 'products', 'suppliers', 'users', 'roles',
];

function cleanValue(v) {
  if (v === undefined) return null;
  const trimmed = typeof v === 'string' ? v.trim() : v;
  if (trimmed === '' || trimmed === 'NULL' || trimmed === 'null') return null;
  return trimmed;
}

// Hệ thống chỉ dùng 2 phân quyền: Admin và Customer.
// Dataset gốc có thêm role "Warehouse_Staff" (id=2) -> bỏ qua role này khi nhập,
// và gộp toàn bộ user thuộc role đó thành Customer (id=3) để không vướng khóa ngoại.
const SKIP_ROLE_NAMES = ['Warehouse_Staff'];
let skippedRoleIds = new Set();

async function importFile(conn, filePath, table) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let records = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  if (records.length === 0) return 0;

  if (table === 'roles') {
    records = records.filter((r) => {
      const skip = SKIP_ROLE_NAMES.includes(r.role_name);
      if (skip) skippedRoleIds.add(String(r.id));
      return !skip;
    });
    if (records.length === 0) return 0;
  }

  if (table === 'users' && skippedRoleIds.size > 0) {
    const customerRoleId = (await conn.query("SELECT id FROM roles WHERE role_name = 'Customer'"))[0][0]?.id;
    records = records.map((r) => {
      if (skippedRoleIds.has(String(r.role_id)) && customerRoleId) {
        return { ...r, role_id: String(customerRoleId) };
      }
      return r;
    });
  }

  const columns = Object.keys(records[0]);
  const placeholders = '(' + columns.map(() => '?').join(',') + ')';
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`;

  for (const record of records) {
    const values = columns.map((c) => cleanValue(record[c]));
    await conn.query(sql, values);
  }
  return records.length;
}

async function main() {
  if (!fs.existsSync(DATASET_DIR)) {
    console.error(`❌ Không tìm thấy thư mục dataset: ${DATASET_DIR}`);
    process.exit(1);
  }

  const conn = await pool.getConnection();
  try {
    console.log('🧹 Đang xóa dữ liệu cũ trong 12 bảng...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TRUNCATE_ORDER) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('📥 Đang nhập dữ liệu từ CSV...');
    for (const { file, table } of IMPORT_ORDER) {
      const filePath = path.join(DATASET_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Bỏ qua (không tìm thấy file): ${file}`);
        continue;
      }
      const count = await importFile(conn, filePath, table);
      console.log(`   ✓ ${file} → ${table} (${count} dòng)`);
    }

    console.log('\n✅ Nhập dữ liệu hoàn tất! Toàn bộ 12 bảng đã có dữ liệu thật (chỉ giữ 2 phân quyền Admin/Customer).');
    console.log('⚠️  Lưu ý: mật khẩu (password_hash) trong dataset là dữ liệu giả lập, KHÔNG dùng để đăng nhập được.');
    console.log('   Chạy thêm: npm run ensure-demo-users  để tạo 2 tài khoản đăng nhập được (admin/customer).');
  } catch (err) {
    console.error('❌ Lỗi khi nhập dữ liệu:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

main();

// server/db/seed.js
// Chạy: npm run seed
// Tạo dữ liệu mẫu: roles, tài khoản demo, nhà cung cấp, sản phẩm, lô hàng, voucher.

const bcrypt = require('bcryptjs');
const { query, get, pool } = require('./database');

async function upsertRole(role_name, description) {
  const existing = await get('SELECT id FROM roles WHERE role_name = ?', [role_name]);
  if (existing) return existing.id;
  const [res] = await pool.query('INSERT INTO roles (role_name, description) VALUES (?, ?)', [role_name, description]);
  return res.insertId;
}

async function upsertUser({ role_id, email, password, full_name, phone, membership_level }) {
  const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, 10);
  const [res] = await pool.query(
    `INSERT INTO users (role_id, email, password_hash, full_name, phone, membership_level)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [role_id, email, hash, full_name, phone || null, membership_level || 'Bronze']
  );
  return res.insertId;
}

async function upsertSupplier(supplier_name, contact_phone, contact_email, address) {
  const existing = await get('SELECT id FROM suppliers WHERE supplier_name = ?', [supplier_name]);
  if (existing) return existing.id;
  const [res] = await pool.query(
    'INSERT INTO suppliers (supplier_name, contact_phone, contact_email, address) VALUES (?, ?, ?, ?)',
    [supplier_name, contact_phone, contact_email, address]
  );
  return res.insertId;
}

async function upsertProduct(p) {
  const existing = await get('SELECT id FROM products WHERE sku = ?', [p.sku]);
  if (existing) {
    await pool.query(
      `UPDATE products SET name=?, category_name=?, brand_name=?, price=?, original_price=?, stock_quantity=?, ingredients=?, usage_instructions=? WHERE sku=?`,
      [p.name, p.category_name, p.brand_name, p.price, p.original_price, p.stock_quantity, p.ingredients, p.usage_instructions, p.sku]
    );
    return existing.id;
  }
  const [res] = await pool.query(
    `INSERT INTO products (sku, name, category_name, brand_name, price, original_price, stock_quantity, ingredients, usage_instructions)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [p.sku, p.name, p.category_name, p.brand_name, p.price, p.original_price, p.stock_quantity, p.ingredients, p.usage_instructions]
  );
  return res.insertId;
}

async function upsertBatch(product_id, supplier_id, batch_code, quantity, import_price, expiration_date) {
  const existing = await get('SELECT id FROM inventory_batches WHERE batch_code = ?', [batch_code]);
  if (existing) return existing.id;
  const [res] = await pool.query(
    `INSERT INTO inventory_batches (product_id, supplier_id, batch_code, quantity_imported, quantity_remaining, import_price, expiration_date)
     VALUES (?,?,?,?,?,?,?)`,
    [product_id, supplier_id, batch_code, quantity, quantity, import_price, expiration_date]
  );
  return res.insertId;
}

async function upsertVoucher(v) {
  const existing = await get('SELECT id FROM vouchers WHERE code = ?', [v.code]);
  if (existing) return existing.id;
  const [res] = await pool.query(
    `INSERT INTO vouchers (code, discount_type, discount_value, min_order_value, end_date) VALUES (?,?,?,?,?)`,
    [v.code, v.discount_type, v.discount_value, v.min_order_value, v.end_date]
  );
  return res.insertId;
}

async function seed() {
  console.log('🌱 Seeding database online_NTII...');

  const adminRole = await upsertRole('Admin', 'Quản trị toàn hệ thống');
  const customerRole = await upsertRole('Customer', 'Khách hàng mua sắm');

  await upsertUser({ role_id: adminRole, email: 'admin@ntii.vn', password: 'admin123', full_name: 'Quản trị viên' });
  await upsertUser({ role_id: customerRole, email: 'customer@ntii.vn', password: 'customer123', full_name: 'Nguyễn Thị Khách', phone: '0900000000', membership_level: 'Silver' });

  const sup1 = await upsertSupplier('Công ty TNHH Mỹ phẩm Hàn Quốc K-Beauty', '0281234567', 'contact@kbeauty.vn', '12 Nguyễn Huệ, Q1, TP.HCM');
  const sup2 = await upsertSupplier('Công ty CP Dược phẩm Thiên Nhiên Việt', '0247654321', 'sales@thiennvi.vn', '45 Cầu Giấy, Hà Nội');

  const products = [
    { sku: 'CLN-001', name: 'Sữa Rửa Mặt NT-II Gentle Foam', category_name: 'Sữa rửa mặt', brand_name: 'NT-II', price: 285000, original_price: 320000, stock_quantity: 120, ingredients: 'Centella Asiatica, Panthenol, Glycerin', usage_instructions: 'Thoa lên da ẩm, massage nhẹ rồi rửa sạch với nước. Dùng sáng và tối.' },
    { sku: 'CLN-002', name: 'Sữa Rửa Mặt Hydra Cream Cleanser', category_name: 'Sữa rửa mặt', brand_name: 'NT-II', price: 310000, original_price: 310000, stock_quantity: 80, ingredients: 'Ceramide, Hyaluronic Acid', usage_instructions: 'Massage nhẹ lên da ẩm trong 1 phút rồi rửa sạch.' },
    { sku: 'SER-001', name: 'Serum Vitamin C Brightening 20%', category_name: 'Serum & Tinh chất', brand_name: 'NT-II Lab', price: 650000, original_price: 780000, stock_quantity: 60, ingredients: 'L-Ascorbic Acid 20%, Vitamin E, Ferulic Acid', usage_instructions: 'Dùng 2-3 giọt vào buổi sáng sau khi rửa mặt, trước kem chống nắng.' },
    { sku: 'SER-002', name: 'Serum Niacinamide 10% + Zinc 1%', category_name: 'Serum & Tinh chất', brand_name: 'NT-II Lab', price: 320000, original_price: 320000, stock_quantity: 150, ingredients: 'Niacinamide 10%, Zinc PCA 1%', usage_instructions: 'Thoa đều lên da sau bước toner, sáng và tối.' },
    { sku: 'SER-003', name: 'Serum Hyaluronic Acid B5 Cấp Nước', category_name: 'Serum & Tinh chất', brand_name: 'AquaDerm', price: 410000, original_price: 460000, stock_quantity: 90, ingredients: 'Hyaluronic Acid đa phân tử, Panthenol B5', usage_instructions: 'Thoa lên da còn ẩm để tăng khả năng cấp nước.' },
    { sku: 'SER-004', name: 'Tinh Chất Retinol 0.3% Phục Hồi Đêm', category_name: 'Serum & Tinh chất', brand_name: 'NT-II Lab', price: 590000, original_price: 590000, stock_quantity: 45, ingredients: 'Encapsulated Retinol 0.3%, Squalane', usage_instructions: 'Chỉ dùng vào buổi tối, bắt đầu 2-3 lần/tuần.' },
    { sku: 'MOI-001', name: 'Kem Dưỡng Ẩm Ceramide Barrier Repair', category_name: 'Kem dưỡng ẩm', brand_name: 'AquaDerm', price: 450000, original_price: 520000, stock_quantity: 100, ingredients: 'Ceramide NP, Cholesterol, Fatty Acids', usage_instructions: 'Thoa đều lên mặt và cổ sau bước serum, sáng và tối.' },
    { sku: 'MOI-002', name: 'Gel Dưỡng Ẩm Cica Soothing Gel', category_name: 'Kem dưỡng ẩm', brand_name: 'NT-II', price: 280000, original_price: 280000, stock_quantity: 130, ingredients: 'Centella Asiatica Extract, Madecassoside', usage_instructions: 'Dùng lượng vừa đủ thoa đều, phù hợp da dầu mụn.' },
    { sku: 'MOI-003', name: 'Kem Dưỡng Đêm Collagen Firming', category_name: 'Kem dưỡng ẩm', brand_name: 'NT-II Lab', price: 720000, original_price: 850000, stock_quantity: 55, ingredients: 'Collagen thủy phân, Peptide phức hợp', usage_instructions: 'Dùng vào buổi tối như bước cuối cùng trong quy trình.' },
    { sku: 'SUN-001', name: 'Kem Chống Nắng Aqua Fresh SPF50+ PA++++', category_name: 'Kem chống nắng', brand_name: 'SunCare', price: 350000, original_price: 390000, stock_quantity: 200, ingredients: 'Tinosorb S, Niacinamide', usage_instructions: 'Thoa lại sau mỗi 2-3 giờ khi ở ngoài nắng.' },
    { sku: 'SUN-002', name: 'Kem Chống Nắng Hydrating SPF50 Cho Da Khô', category_name: 'Kem chống nắng', brand_name: 'SunCare', price: 365000, original_price: 365000, stock_quantity: 140, ingredients: 'Hyaluronic Acid, Zinc Oxide', usage_instructions: 'Thoa đều 20 phút trước khi ra ngoài.' },
    { sku: 'TON-001', name: 'Nước Cân Bằng Rose Hydrating Toner', category_name: 'Toner & Nước cân bằng', brand_name: 'AquaDerm', price: 260000, original_price: 260000, stock_quantity: 110, ingredients: 'Rose Water, Glycerin, Allantoin', usage_instructions: 'Thấm vào bông tẩy trang hoặc dùng tay vỗ nhẹ lên da.' },
    { sku: 'TON-002', name: 'Toner Tẩy Da Chết BHA 2% Salicylic', category_name: 'Toner & Nước cân bằng', brand_name: 'NT-II Lab', price: 340000, original_price: 380000, stock_quantity: 95, ingredients: 'Salicylic Acid 2%, Witch Hazel', usage_instructions: 'Dùng 2-3 lần/tuần vào buổi tối, tránh vùng mắt.' },
    { sku: 'MSK-001', name: 'Mặt Nạ Giấy Cấp Ẩm Hyaluronic', category_name: 'Mặt nạ', brand_name: 'NT-II', price: 35000, original_price: 45000, stock_quantity: 300, ingredients: 'Hyaluronic Acid, Aloe Vera', usage_instructions: 'Đắp 15-20 phút, dùng 2-3 lần/tuần.' },
    { sku: 'MSK-002', name: 'Mặt Nạ Đất Sét Thải Độc Da Clay Mask', category_name: 'Mặt nạ', brand_name: 'AquaDerm', price: 220000, original_price: 220000, stock_quantity: 85, ingredients: 'Kaolin Clay, Bentonite, Tea Tree Oil', usage_instructions: 'Đắp lớp mỏng 10 phút rồi rửa sạch, 1-2 lần/tuần.' },
  ];

  const productIds = {};
  for (const p of products) {
    productIds[p.sku] = await upsertProduct(p);
  }

  // Lô hàng nhập kho mẫu cho vài sản phẩm
  await upsertBatch(productIds['CLN-001'], sup1, 'LOT-CLN001-01', 100, 180000, '2027-06-30');
  await upsertBatch(productIds['SER-001'], sup2, 'LOT-SER001-01', 50, 420000, '2027-03-31');
  await upsertBatch(productIds['SUN-001'], sup1, 'LOT-SUN001-01', 150, 220000, '2027-12-31');

  await upsertVoucher({ code: 'LUMIERE10', discount_type: 'Percentage', discount_value: 10, min_order_value: 300000, end_date: '2027-12-31 23:59:59' });
  await upsertVoucher({ code: 'FREESHIP', discount_type: 'Fixed_Amount', discount_value: 30000, min_order_value: 0, end_date: '2027-12-31 23:59:59' });

  const count = await get('SELECT COUNT(*) c FROM products');
  console.log(`✅ Seed hoàn tất. Tổng số sản phẩm: ${count.c}`);
  console.log('   Đăng nhập admin     : admin@ntii.vn / admin123');
  console.log('   Đăng nhập khách     : customer@ntii.vn / customer123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi khi seed:', err);
  process.exit(1);
});

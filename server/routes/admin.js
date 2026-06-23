// server/routes/admin.js
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { query, get, pool } = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole('Admin'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ---------- Dashboard ----------
router.get('/stats', async (req, res) => {
  const totalProducts = (await get('SELECT COUNT(*) c FROM products')).c;
  const totalOrders = (await get('SELECT COUNT(*) c FROM orders')).c;
  const totalCustomers = (await get(
    "SELECT COUNT(*) c FROM users u JOIN roles r ON r.id = u.role_id WHERE r.role_name = 'Customer'"
  )).c;
  const revenue = (await get("SELECT COALESCE(SUM(final_amount),0) r FROM orders WHERE order_status != 'Cancelled'")).r;
  const lowStock = await query('SELECT id, sku, name, stock_quantity FROM products WHERE is_active = 1 AND stock_quantity <= 10 ORDER BY stock_quantity ASC');
  const recentOrders = await query(
    `SELECT o.id, o.final_amount, o.order_status, o.created_at, u.full_name, u.email
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 10`
  );
  res.json({ totalProducts, totalOrders, totalCustomers, revenue, lowStock, recentOrders });
});

// ---------- Orders management ----------
router.get('/orders', async (req, res) => {
  const orders = await query(
    `SELECT o.*, u.full_name, u.email,
            pay.payment_method, pay.payment_status,
            sh.shipping_status, sh.tracking_number
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN payments pay ON pay.order_id = o.id
     LEFT JOIN shippings sh ON sh.order_id = o.id
     ORDER BY o.created_at DESC`
  );
  res.json(orders);
});

router.put('/orders/:id/status', async (req, res) => {
  const { order_status, shipping_status, tracking_number } = req.body;
  const order = await get('SELECT id FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

  if (order_status) {
    const valid = ['Pending_Payment', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Returned'];
    if (!valid.includes(order_status)) return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ.' });
    await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, order.id]);
  }
  if (shipping_status || tracking_number) {
    await pool.query(
      `UPDATE shippings SET shipping_status = COALESCE(?, shipping_status), tracking_number = COALESCE(?, tracking_number),
       shipped_at = CASE WHEN ? = 'In_Transit' THEN NOW() ELSE shipped_at END WHERE order_id = ?`,
      [shipping_status || null, tracking_number || null, shipping_status || '', order.id]
    );
  }
  res.json({ message: 'Đã cập nhật đơn hàng.' });
});

// ---------- Inventory: Products (Quản lý kho & tồn kho) ----------
router.get('/products', async (req, res) => {
  res.json(await query('SELECT * FROM products ORDER BY created_at DESC'));
});

router.post('/products', async (req, res) => {
  const { sku, name, category_name, brand_name, price, original_price, stock_quantity, ingredients, usage_instructions } = req.body;
  if (!sku || !name || !category_name || !brand_name || !price || !original_price) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ SKU, tên, danh mục, nhãn hàng và giá.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO products (sku, name, category_name, brand_name, price, original_price, stock_quantity, ingredients, usage_instructions)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [sku, name, category_name, brand_name, price, original_price, stock_quantity || 0, ingredients || '', usage_instructions || '']
    );
    res.status(201).json(await get('SELECT * FROM products WHERE id = ?', [result.insertId]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'SKU sản phẩm đã tồn tại.' });
    throw err;
  }
});

router.put('/products/:id', async (req, res) => {
  const p = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  const fields = ['sku', 'name', 'category_name', 'brand_name', 'price', 'original_price', 'ingredients', 'usage_instructions', 'is_active'];
  const merged = {};
  fields.forEach((f) => (merged[f] = req.body[f] !== undefined ? req.body[f] : p[f]));
  await pool.query(
    `UPDATE products SET sku=?, name=?, category_name=?, brand_name=?, price=?, original_price=?, ingredients=?, usage_instructions=?, is_active=? WHERE id=?`,
    [merged.sku, merged.name, merged.category_name, merged.brand_name, merged.price, merged.original_price, merged.ingredients, merged.usage_instructions, merged.is_active, req.params.id]
  );
  res.json(await get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

// PUT /api/admin/products/:id/stock  - điều chỉnh tồn kho trực tiếp (không qua lô hàng)
router.put('/products/:id/stock', async (req, res) => {
  const { stock_quantity } = req.body;
  await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [Math.max(0, stock_quantity), req.params.id]);
  res.json(await get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã xóa sản phẩm khỏi database.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      // Sản phẩm đã có đơn hàng/đánh giá/lô hàng tham chiếu -> chỉ ẩn đi (soft delete)
      await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Sản phẩm đã từng được giao dịch nên không thể xóa hẳn — hệ thống đã ẩn sản phẩm này khỏi cửa hàng.' });
    }
    throw err;
  }
});

// ---------- Suppliers (Nhà cung cấp) ----------
router.get('/suppliers', async (req, res) => {
  res.json(await query('SELECT * FROM suppliers ORDER BY supplier_name'));
});

router.post('/suppliers', async (req, res) => {
  const { supplier_name, contact_phone, contact_email, address } = req.body;
  if (!supplier_name) return res.status(400).json({ error: 'Vui lòng nhập tên nhà cung cấp.' });
  const [result] = await pool.query(
    'INSERT INTO suppliers (supplier_name, contact_phone, contact_email, address) VALUES (?,?,?,?)',
    [supplier_name, contact_phone || null, contact_email || null, address || null]
  );
  res.status(201).json(await get('SELECT * FROM suppliers WHERE id = ?', [result.insertId]));
});

// ---------- Inventory batches (Lô hàng nhập kho) ----------
router.get('/batches', async (req, res) => {
  const { product_id } = req.query;
  let sql = `SELECT b.*, p.name as product_name, p.sku, s.supplier_name FROM inventory_batches b
             JOIN products p ON p.id = b.product_id JOIN suppliers s ON s.id = b.supplier_id`;
  const params = [];
  if (product_id) { sql += ' WHERE b.product_id = ?'; params.push(product_id); }
  sql += ' ORDER BY b.imported_at DESC';
  res.json(await query(sql, params));
});

// POST /api/admin/batches  - Nhập kho: tạo lô hàng mới và CỘNG vào tồn kho sản phẩm
router.post('/batches', async (req, res) => {
  const { product_id, supplier_id, batch_code, quantity_imported, import_price, expiration_date } = req.body;
  if (!product_id || !supplier_id || !batch_code || !quantity_imported || !import_price || !expiration_date) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin lô hàng.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO inventory_batches (product_id, supplier_id, batch_code, quantity_imported, quantity_remaining, import_price, expiration_date)
       VALUES (?,?,?,?,?,?,?)`,
      [product_id, supplier_id, batch_code, quantity_imported, quantity_imported, import_price, expiration_date]
    );
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [quantity_imported, product_id]);
    res.status(201).json(await get('SELECT * FROM inventory_batches WHERE id = ?', [result.insertId]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Mã lô hàng đã tồn tại.' });
    throw err;
  }
});

// ---------- Nhập dữ liệu sản phẩm từ CSV vào database ----------
// Cột CSV: sku,name,category_name,brand_name,price,original_price,stock_quantity,ingredients,usage_instructions
router.post('/products/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file CSV để nhập.' });
  let records;
  try {
    records = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    return res.status(400).json({ error: 'File CSV không hợp lệ: ' + err.message });
  }

  let imported = 0, updated = 0;
  const errors = [];

  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx];
    try {
      if (!row.sku || !row.name || !row.price || !row.original_price) {
        errors.push(`Dòng ${idx + 2}: thiếu sku/name/price/original_price.`);
        continue;
      }
      const existing = await get('SELECT id FROM products WHERE sku = ?', [row.sku]);
      if (existing) {
        await pool.query(
          `UPDATE products SET name=?, category_name=?, brand_name=?, price=?, original_price=?, stock_quantity=?, ingredients=?, usage_instructions=? WHERE sku=?`,
          [row.name, row.category_name || '', row.brand_name || '', Number(row.price), Number(row.original_price), Number(row.stock_quantity || 0), row.ingredients || '', row.usage_instructions || '', row.sku]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO products (sku, name, category_name, brand_name, price, original_price, stock_quantity, ingredients, usage_instructions)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [row.sku, row.name, row.category_name || '', row.brand_name || '', Number(row.price), Number(row.original_price), Number(row.stock_quantity || 0), row.ingredients || '', row.usage_instructions || '']
        );
        imported++;
      }
    } catch (err) {
      errors.push(`Dòng ${idx + 2}: ${err.message}`);
    }
  }

  res.json({ message: `Nhập dữ liệu hoàn tất: ${imported} sản phẩm mới, ${updated} sản phẩm cập nhật.`, imported, updated, errors });
});

// ---------- Vouchers ----------
router.get('/vouchers', async (req, res) => {
  res.json(await query('SELECT * FROM vouchers ORDER BY end_date DESC'));
});

router.post('/vouchers', async (req, res) => {
  const { code, discount_type, discount_value, min_order_value, end_date } = req.body;
  if (!code || !discount_type || !discount_value || !end_date) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin voucher.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO vouchers (code, discount_type, discount_value, min_order_value, end_date) VALUES (?,?,?,?,?)',
      [code.toUpperCase(), discount_type, discount_value, min_order_value || 0, end_date]
    );
    res.status(201).json(await get('SELECT * FROM vouchers WHERE id = ?', [result.insertId]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Mã voucher đã tồn tại.' });
    throw err;
  }
});

router.put('/vouchers/:id', async (req, res) => {
  const { is_active } = req.body;
  await pool.query('UPDATE vouchers SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
  res.json(await get('SELECT * FROM vouchers WHERE id = ?', [req.params.id]));
});

module.exports = router;

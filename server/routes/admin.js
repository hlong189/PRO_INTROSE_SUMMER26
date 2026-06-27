// server/routes/admin.js
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { query, get, pool } = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');
<<<<<<< HEAD
=======
const { isPositiveNumber, isNonNegativeInteger } = require('../utils/validators');
>>>>>>> 67673ed (Nội dung cập nhật)

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

<<<<<<< HEAD
=======
// GET /api/admin/reorder-suggestions — sản phẩm sắp hết hàng + nhà cung cấp gần nhất đã nhập
router.get('/reorder-suggestions', async (req, res) => {
  const rows = await query(`
    SELECT p.id, p.sku, p.name, p.stock_quantity,
           (SELECT s.supplier_name FROM inventory_batches b JOIN suppliers s ON s.id = b.supplier_id
            WHERE b.product_id = p.id ORDER BY b.imported_at DESC LIMIT 1) AS last_supplier,
           (SELECT b.import_price FROM inventory_batches b WHERE b.product_id = p.id ORDER BY b.imported_at DESC LIMIT 1) AS last_import_price,
           GREATEST(20 - p.stock_quantity, 10) AS suggested_quantity
    FROM products p
    WHERE p.is_active = 1 AND p.stock_quantity <= 10
    ORDER BY p.stock_quantity ASC
  `);
  res.json(rows);
});

>>>>>>> 67673ed (Nội dung cập nhật)
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

<<<<<<< HEAD
router.put('/orders/:id/status', async (req, res) => {
  const { order_status, shipping_status, tracking_number } = req.body;
  const order = await get('SELECT id FROM orders WHERE id = ?', [req.params.id]);
=======
const ORDER_TO_SHIPPING = {
  Pending_Payment: 'Preparing',
  Processing: 'Preparing',
  Shipping: 'In_Transit',
  Completed: 'Delivered',
  Cancelled: null,
  Returned: 'Delivery_Failed',
};
const STOCK_RESTORE_STATUSES = ['Cancelled', 'Returned'];

router.put('/orders/:id/status', async (req, res) => {
  const { order_status, tracking_number } = req.body;
  const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
>>>>>>> 67673ed (Nội dung cập nhật)
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

  if (order_status) {
    const valid = ['Pending_Payment', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Returned'];
    if (!valid.includes(order_status)) return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ.' });
<<<<<<< HEAD
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

=======

    await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, order.id]);

    const newShippingStatus = ORDER_TO_SHIPPING[order_status];
    if (newShippingStatus) {
      await pool.query(
        `UPDATE shippings SET shipping_status = ?, shipped_at = CASE WHEN ? = 'In_Transit' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END WHERE order_id = ?`,
        [newShippingStatus, newShippingStatus, order.id]
      );
    }

    const wasRestoredAlready = STOCK_RESTORE_STATUSES.includes(order.order_status);
    if (STOCK_RESTORE_STATUSES.includes(order_status) && !wasRestoredAlready) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of items) {
        await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
  }

  if (tracking_number) {
    await pool.query(
      `UPDATE shippings SET tracking_number = ?, shipping_status = 'In_Transit', shipped_at = COALESCE(shipped_at, NOW()) WHERE order_id = ?`,
      [tracking_number, order.id]
    );
    if (order.order_status === 'Processing' || order.order_status === 'Pending_Payment') {
      await pool.query("UPDATE orders SET order_status = 'Shipping' WHERE id = ?", [order.id]);
    }
  }

  res.json({ message: 'Đã cập nhật đơn hàng.' });
});

// ---------- Quản lý khách hàng (khóa tài khoản vi phạm) ----------
router.get('/users', async (req, res) => {
  const users = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.membership_level, u.accumulated_points, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id WHERE r.role_name = 'Customer' ORDER BY u.created_at DESC`
  );
  res.json(users);
});

router.put('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Đã cập nhật trạng thái tài khoản.' });
});

>>>>>>> 67673ed (Nội dung cập nhật)
// ---------- Inventory: Products (Quản lý kho & tồn kho) ----------
router.get('/products', async (req, res) => {
  res.json(await query('SELECT * FROM products ORDER BY created_at DESC'));
});

<<<<<<< HEAD
=======
// GET /api/admin/next-sku?category=Serum  -> gợi ý SKU dạng SKU-DANHMUC-0001
router.get('/next-sku', async (req, res) => {
  const category = (req.query.category || 'SP').trim();
  const prefix = category
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'SP';
  const existing = await query('SELECT sku FROM products WHERE sku LIKE ?', [`SKU-${prefix}-%`]);
  let maxNum = 0;
  existing.forEach((p) => {
    const m = p.sku.match(/-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  const nextSku = `SKU-${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  res.json({ sku: nextSku });
});

function validateProductBody(body) {
  if (!isPositiveNumber(body.price)) return 'Giá bán phải lớn hơn 0.';
  if (!isPositiveNumber(body.original_price)) return 'Giá gốc phải lớn hơn 0.';
  if (body.stock_quantity !== undefined && !isNonNegativeInteger(body.stock_quantity)) return 'Tồn kho không được là số âm.';
  return null;
}

>>>>>>> 67673ed (Nội dung cập nhật)
router.post('/products', async (req, res) => {
  const { sku, name, category_name, brand_name, price, original_price, stock_quantity, ingredients, usage_instructions } = req.body;
  if (!sku || !name || !category_name || !brand_name || !price || !original_price) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ SKU, tên, danh mục, nhãn hàng và giá.' });
  }
<<<<<<< HEAD
=======
  const validationError = validateProductBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

>>>>>>> 67673ed (Nội dung cập nhật)
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
<<<<<<< HEAD
=======
  const validationError = validateProductBody({ ...p, ...req.body });
  if (validationError) return res.status(400).json({ error: validationError });

>>>>>>> 67673ed (Nội dung cập nhật)
  const fields = ['sku', 'name', 'category_name', 'brand_name', 'price', 'original_price', 'ingredients', 'usage_instructions', 'is_active'];
  const merged = {};
  fields.forEach((f) => (merged[f] = req.body[f] !== undefined ? req.body[f] : p[f]));
  await pool.query(
    `UPDATE products SET sku=?, name=?, category_name=?, brand_name=?, price=?, original_price=?, ingredients=?, usage_instructions=?, is_active=? WHERE id=?`,
    [merged.sku, merged.name, merged.category_name, merged.brand_name, merged.price, merged.original_price, merged.ingredients, merged.usage_instructions, merged.is_active, req.params.id]
  );
  res.json(await get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

<<<<<<< HEAD
// PUT /api/admin/products/:id/stock  - điều chỉnh tồn kho trực tiếp (không qua lô hàng)
router.put('/products/:id/stock', async (req, res) => {
  const { stock_quantity } = req.body;
  await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [Math.max(0, stock_quantity), req.params.id]);
=======
router.put('/products/:id/stock', async (req, res) => {
  const { stock_quantity } = req.body;
  if (!isNonNegativeInteger(stock_quantity)) return res.status(400).json({ error: 'Tồn kho không được là số âm.' });
  await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [stock_quantity, req.params.id]);
  res.json(await get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

router.put('/products/:id/visibility', async (req, res) => {
  const { is_active } = req.body;
  await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
>>>>>>> 67673ed (Nội dung cập nhật)
  res.json(await get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã xóa sản phẩm khỏi database.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
<<<<<<< HEAD
      // Sản phẩm đã có đơn hàng/đánh giá/lô hàng tham chiếu -> chỉ ẩn đi (soft delete)
=======
>>>>>>> 67673ed (Nội dung cập nhật)
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

<<<<<<< HEAD
// POST /api/admin/batches  - Nhập kho: tạo lô hàng mới và CỘNG vào tồn kho sản phẩm
=======
>>>>>>> 67673ed (Nội dung cập nhật)
router.post('/batches', async (req, res) => {
  const { product_id, supplier_id, batch_code, quantity_imported, import_price, expiration_date } = req.body;
  if (!product_id || !supplier_id || !batch_code || !quantity_imported || !import_price || !expiration_date) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin lô hàng.' });
  }
<<<<<<< HEAD
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
=======
  if (!isPositiveNumber(quantity_imported)) return res.status(400).json({ error: 'Số lượng nhập phải lớn hơn 0.' });
  if (!isPositiveNumber(import_price)) return res.status(400).json({ error: 'Giá nhập phải lớn hơn 0.' });

  const existingBatch = await get('SELECT id FROM inventory_batches WHERE batch_code = ?', [batch_code.trim()]);
  if (existingBatch) {
    return res.status(409).json({ error: 'Mã lô hàng này đã tồn tại, vui lòng đặt mã khác.' });
  }

  const [result] = await pool.query(
    `INSERT INTO inventory_batches (product_id, supplier_id, batch_code, quantity_imported, quantity_remaining, import_price, expiration_date)
     VALUES (?,?,?,?,?,?,?)`,
    [product_id, supplier_id, batch_code.trim(), quantity_imported, quantity_imported, import_price, expiration_date]
  );
  await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [quantity_imported, product_id]);
  res.status(201).json(await get('SELECT * FROM inventory_batches WHERE id = ?', [result.insertId]));
});

// ---------- Nhập dữ liệu sản phẩm từ CSV vào database ----------
>>>>>>> 67673ed (Nội dung cập nhật)
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
<<<<<<< HEAD
=======
      if (Number(row.price) <= 0 || Number(row.original_price) <= 0) {
        errors.push(`Dòng ${idx + 2}: giá phải lớn hơn 0.`);
        continue;
      }
      if (Number(row.stock_quantity || 0) < 0) {
        errors.push(`Dòng ${idx + 2}: tồn kho không được âm.`);
        continue;
      }
>>>>>>> 67673ed (Nội dung cập nhật)
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

<<<<<<< HEAD
// ---------- Vouchers ----------
=======
// ---------- Vouchers (Khuyến mãi theo chiến dịch) ----------
>>>>>>> 67673ed (Nội dung cập nhật)
router.get('/vouchers', async (req, res) => {
  res.json(await query('SELECT * FROM vouchers ORDER BY end_date DESC'));
});

router.post('/vouchers', async (req, res) => {
  const { code, discount_type, discount_value, min_order_value, end_date } = req.body;
  if (!code || !discount_type || !discount_value || !end_date) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin voucher.' });
  }
<<<<<<< HEAD
=======
  if (!isPositiveNumber(discount_value)) return res.status(400).json({ error: 'Giá trị giảm giá phải lớn hơn 0.' });
>>>>>>> 67673ed (Nội dung cập nhật)
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

<<<<<<< HEAD
=======
// ---------- Đánh giá: Admin phản hồi đánh giá khách hàng ----------
router.get('/reviews', async (req, res) => {
  const reviews = await query(`
    SELECT r.id, r.rating, r.comment, r.created_at, r.parent_id, r.is_hidden,
           u.full_name AS reviewer_name, p.name AS product_name, p.sku
    FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
    ORDER BY r.created_at DESC
  `);
  res.json(reviews);
});

router.post('/reviews/:id/reply', async (req, res) => {
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'Vui lòng nhập nội dung phản hồi.' });
  const parent = await get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!parent) return res.status(404).json({ error: 'Không tìm thấy đánh giá.' });
  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, comment, parent_id) VALUES (?, ?, ?, ?, ?)',
    [parent.product_id, req.user.id, parent.rating, comment.trim(), parent.id]
  );
  res.status(201).json({ id: result.insertId, message: 'Đã gửi phản hồi.' });
});

>>>>>>> 67673ed (Nội dung cập nhật)
module.exports = router;

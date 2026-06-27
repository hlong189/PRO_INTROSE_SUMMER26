// server/routes/orders.js
const express = require('express');
const { query, get, pool, transaction } = require('../db/database');
const { verifyToken } = require('../middleware/auth');
<<<<<<< HEAD
=======
const { isValidPhone, isValidPlaceName, isValidAddressLine } = require('../utils/validators');
>>>>>>> 67673ed (Nội dung cập nhật)

const router = express.Router();
router.use(verifyToken);

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 500000;

function computeMembership(points) {
  if (points >= 5000) return 'Diamond';
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
}

<<<<<<< HEAD
=======
// GET /api/orders/available-vouchers?subtotal=  - danh sách mã giảm giá còn dùng được, để hiển thị dạng dropdown
router.get('/available-vouchers', async (req, res) => {
  const subtotal = Number(req.query.subtotal || 0);
  const vouchers = await query(
    'SELECT id, code, discount_type, discount_value, min_order_value FROM vouchers WHERE is_active = 1 AND end_date >= NOW() AND min_order_value <= ? ORDER BY discount_value DESC',
    [subtotal]
  );
  res.json(vouchers);
});

>>>>>>> 67673ed (Nội dung cập nhật)
// POST /api/orders/validate-voucher  { code, subtotal }
router.post('/validate-voucher', async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá.' });
  const voucher = await get(
    'SELECT * FROM vouchers WHERE code = ? AND is_active = 1 AND end_date >= NOW()',
    [code.toUpperCase()]
  );
  if (!voucher) return res.status(404).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
  if (Number(subtotal) < Number(voucher.min_order_value)) {
    return res.status(400).json({ error: `Đơn hàng cần tối thiểu ${Number(voucher.min_order_value).toLocaleString('vi-VN')}đ để dùng mã này.` });
  }
  const discount = voucher.discount_type === 'Percentage'
    ? Math.round(Number(subtotal) * Number(voucher.discount_value) / 100)
    : Number(voucher.discount_value);
  res.json({ voucher_id: voucher.id, code: voucher.code, discount_amount: Math.min(discount, Number(subtotal)) });
});

// POST /api/orders  - Checkout: tạo order + order_items + payments + shippings trong 1 transaction
router.post('/', async (req, res) => {
<<<<<<< HEAD
  const { items, voucher_code, payment_method, recipient_name, recipient_phone, province_city, ward, specific_address } = req.body;
=======
  const { items, voucher_code, payment_method, payment_confirmed, recipient_name, recipient_phone, province_city, ward, specific_address } = req.body;
>>>>>>> 67673ed (Nội dung cập nhật)

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Giỏ hàng đang trống.' });
  if (!recipient_name || !recipient_phone || !province_city || !ward || !specific_address) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin người nhận và địa chỉ giao hàng.' });
  }
<<<<<<< HEAD
  if (!['COD', 'Bank_Transfer', 'VNPay', 'Momo'].includes(payment_method)) {
    return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ.' });
  }
=======
  if (!isValidPhone(recipient_phone)) {
    return res.status(400).json({ error: 'Số điện thoại người nhận không hợp lệ — phải gồm đúng 10 số, không chứa chữ.' });
  }
  if (!isValidPlaceName(province_city)) {
    return res.status(400).json({ error: 'Tỉnh/Thành phố không hợp lệ — không được chỉ nhập số.' });
  }
  if (!isValidPlaceName(ward)) {
    return res.status(400).json({ error: 'Phường/Xã không hợp lệ — không được chỉ nhập số.' });
  }
  if (!isValidAddressLine(specific_address)) {
    return res.status(400).json({ error: 'Địa chỉ cụ thể không hợp lệ — vui lòng nhập đầy đủ số nhà, đường.' });
  }
  if (!['COD', 'Bank_Transfer', 'VNPay', 'Momo'].includes(payment_method)) {
    return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ.' });
  }
  if (payment_method !== 'COD' && !payment_confirmed) {
    return res.status(400).json({ error: 'Vui lòng xác nhận đã thanh toán trước khi hoàn tất đặt hàng.' });
  }
  for (const item of items) {
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      return res.status(400).json({ error: 'Số lượng sản phẩm trong giỏ hàng không hợp lệ.' });
    }
  }
>>>>>>> 67673ed (Nội dung cập nhật)

  try {
    const order = await transaction(async (conn) => {
      // Lấy thông tin sản phẩm mới nhất từ DB (không tin giá từ client)
      const productIds = items.map((i) => Number(i.product_id));
      const [productRows] = await conn.query(
        `SELECT id, name, price, stock_quantity FROM products WHERE id IN (${productIds.map(() => '?').join(',')}) AND is_active = 1`,
        productIds
      );
      const productMap = new Map(productRows.map((p) => [p.id, p]));

      let subtotal = 0;
      for (const item of items) {
        const p = productMap.get(Number(item.product_id));
        if (!p) throw Object.assign(new Error('Một số sản phẩm trong giỏ hàng không còn tồn tại.'), { status: 400 });
        if (item.quantity > p.stock_quantity) {
          throw Object.assign(new Error(`Sản phẩm "${p.name}" không đủ hàng trong kho (còn ${p.stock_quantity}).`), { status: 400 });
        }
        subtotal += Number(p.price) * Number(item.quantity);
      }

      let discount_amount = 0;
      let voucher_id = null;
      if (voucher_code) {
        const [voucherRows] = await conn.query(
          'SELECT * FROM vouchers WHERE code = ? AND is_active = 1 AND end_date >= NOW()',
          [voucher_code.toUpperCase()]
        );
        const voucher = voucherRows[0];
        if (voucher && subtotal >= Number(voucher.min_order_value)) {
          discount_amount = voucher.discount_type === 'Percentage'
            ? Math.round(subtotal * Number(voucher.discount_value) / 100)
            : Number(voucher.discount_value);
          discount_amount = Math.min(discount_amount, subtotal);
          voucher_id = voucher.id;
        }
      }

      const shipping_fee = (subtotal - discount_amount) >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
      const final_amount = subtotal - discount_amount + shipping_fee;

      // Lưu địa chỉ nhận hàng làm địa chỉ mặc định của user (đúng theo schema: địa chỉ nằm ở bảng users)
      await conn.query(
        `UPDATE users SET recipient_name=?, recipient_phone=?, province_city=?, ward=?, specific_address=? WHERE id=?`,
        [recipient_name, recipient_phone, province_city, ward, specific_address, req.user.id]
      );

      const order_status = payment_method === 'COD' ? 'Processing' : 'Pending_Payment';

      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, voucher_id, subtotal_amount, discount_amount, shipping_fee, final_amount, order_status)
         VALUES (?,?,?,?,?,?,?)`,
        [req.user.id, voucher_id, subtotal, discount_amount, shipping_fee, final_amount, order_status]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        const p = productMap.get(Number(item.product_id));
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
          [orderId, p.id, item.quantity, p.price]
        );
        await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, p.id]);
      }

      const payment_status = payment_method === 'COD' ? 'Pending' : 'Completed';
      const paid_at = payment_status === 'Completed' ? new Date() : null;
      await conn.query(
        'INSERT INTO payments (order_id, payment_method, payment_status, paid_at) VALUES (?, ?, ?, ?)',
        [orderId, payment_method, payment_status, paid_at]
      );

      await conn.query(
        `INSERT INTO shippings (order_id, carrier_name, shipping_status, estimated_delivery_date)
         VALUES (?, 'NT-II Express', 'Preparing', DATE_ADD(CURDATE(), INTERVAL 4 DAY))`,
        [orderId]
      );

      // Tích điểm thành viên: 1 điểm / 10.000đ giá trị đơn hàng
      const pointsEarned = Math.floor(final_amount / 10000);
      const [[userRow]] = await conn.query('SELECT accumulated_points FROM users WHERE id = ?', [req.user.id]);
      const newPoints = userRow.accumulated_points + pointsEarned;
      await conn.query('UPDATE users SET accumulated_points = ?, membership_level = ? WHERE id = ?', [
        newPoints, computeMembership(newPoints), req.user.id,
      ]);

      return { id: orderId, subtotal_amount: subtotal, discount_amount, shipping_fee, final_amount, order_status, points_earned: pointsEarned };
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Đã xảy ra lỗi khi tạo đơn hàng.' });
  }
});

async function attachItemsAndStatus(orders) {
  for (const o of orders) {
    o.items = await query(
      `SELECT oi.*, p.name as product_name, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
      [o.id]
    );
    o.payment = await get('SELECT payment_method, payment_status, paid_at FROM payments WHERE order_id = ?', [o.id]);
    o.shipping = await get('SELECT carrier_name, tracking_number, shipping_status, estimated_delivery_date FROM shippings WHERE order_id = ?', [o.id]);
  }
  return orders;
}

// GET /api/orders  - Lịch sử mua hàng
router.get('/', async (req, res) => {
  const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(await attachItemsAndStatus(orders));
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const order = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  const [withDetails] = await attachItemsAndStatus([order]);
  res.json(withDetails);
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  const order = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  if (!['Pending_Payment', 'Processing'].includes(order.order_status)) {
    return res.status(400).json({ error: 'Đơn hàng này không thể hủy ở trạng thái hiện tại.' });
  }
  await pool.query("UPDATE orders SET order_status = 'Cancelled' WHERE id = ?", [order.id]);
  // Hoàn lại tồn kho
  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  for (const item of items) {
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
  }
  res.json({ message: 'Đã hủy đơn hàng.' });
});

module.exports = router;

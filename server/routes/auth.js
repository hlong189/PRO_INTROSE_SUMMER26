// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, pool } = require('../db/database');
const { signToken, verifyToken, loadUserWithRole, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id, full_name: u.full_name, email: u.email, phone: u.phone,
    role_name: u.role_name, membership_level: u.membership_level,
    accumulated_points: u.accumulated_points,
  };
}

// POST /api/auth/register  (luôn tạo với vai trò Customer)
router.post('/register', async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }
  const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return res.status(409).json({ error: 'Email này đã được đăng ký.' });

  const customerRole = await get("SELECT id FROM roles WHERE role_name = 'Customer'");
  if (!customerRole) return res.status(500).json({ error: 'Hệ thống chưa khởi tạo vai trò Customer trong bảng roles.' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [customerRole.id, email.toLowerCase(), hash, full_name, phone || null]
    );
    res.status(201).json({ message: 'Đăng ký thành công. Vui lòng đăng nhập.', userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email hoặc số điện thoại đã được sử dụng.' });
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });

  const user = await get(
    `SELECT u.*, r.role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email.toLowerCase()]
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }
  if (user.status !== 'Active') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.' });
  }

  const token = signToken(user);
  let redirect = '/index.html';
  if (user.role_name === 'Admin') redirect = '/admin-dashboard.html';

  res.json({ token, user: publicUser(user), redirect });
});

// POST /api/auth/forgot-password
// Không có bảng password_resets trong schema -> dùng JWT có hạn ngắn làm "mã khôi phục" (stateless).
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Vui lòng nhập email.' });
  const user = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) {
    return res.json({ message: 'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục đã được gửi.' });
  }
  const resetToken = jwt.sign({ purpose: 'reset_password', email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '30m' });
  // DEMO: chưa tích hợp dịch vụ email thật, trả token trực tiếp để test trên UI.
  res.json({ message: 'Mã khôi phục đã được tạo (demo).', resetToken });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin khôi phục.' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Mã khôi phục không hợp lệ hoặc đã hết hạn.' });
  }
  if (payload.purpose !== 'reset_password') {
    return res.status(400).json({ error: 'Mã khôi phục không hợp lệ.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, payload.email]);
  res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { get } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ntii-dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user.id, role_name: user.role_name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function loadUserWithRole(id) {
  return get(
    `SELECT u.id, u.full_name, u.email, u.phone, u.membership_level, u.accumulated_points,
            u.recipient_name, u.recipient_phone, u.province_city, u.ward, u.specific_address,
            u.status, r.role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [id]
  );
}

async function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await loadUserWithRole(payload.id);
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    if (user.status !== 'Active') return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await loadUserWithRole(payload.id);
    if (user) req.user = user;
  } catch (err) {
    /* ignore */
  }
  next();
}

function requireRole(...roleNames) {
  return (req, res, next) => {
    if (!req.user || !roleNames.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này.' });
    }
    next();
  };
}

module.exports = { signToken, verifyToken, optionalAuth, requireRole, loadUserWithRole, JWT_SECRET };

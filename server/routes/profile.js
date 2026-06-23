// server/routes/profile.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { get, pool } = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/profile
router.get('/', async (req, res) => {
  const skin = await get('SELECT skin_type, primary_concern, allergy_ingredients, updated_at FROM skin_profiles WHERE user_id = ?', [req.user.id]);
  res.json({ ...req.user, skin_profile: skin || null });
});

// PUT /api/profile
router.put('/', async (req, res) => {
  const { full_name, phone, recipient_name, recipient_phone, province_city, ward, specific_address } = req.body;
  await pool.query(
    `UPDATE users SET full_name=?, phone=?, recipient_name=?, recipient_phone=?, province_city=?, ward=?, specific_address=? WHERE id=?`,
    [
      full_name || req.user.full_name,
      phone ?? req.user.phone,
      recipient_name ?? req.user.recipient_name,
      recipient_phone ?? req.user.recipient_phone,
      province_city ?? req.user.province_city,
      ward ?? req.user.ward,
      specific_address ?? req.user.specific_address,
      req.user.id,
    ]
  );
  const { loadUserWithRole } = require('../middleware/auth');
  const updated = await loadUserWithRole(req.user.id);
  res.json(updated);
});

// PUT /api/profile/skin  - Lưu kết quả "Khám phá làn da"
router.put('/skin', async (req, res) => {
  const { skin_type, primary_concern, allergy_ingredients } = req.body;
  if (!['Oily', 'Dry', 'Combination', 'Sensitive'].includes(skin_type)) {
    return res.status(400).json({ error: 'Loại da không hợp lệ.' });
  }
  const existing = await get('SELECT user_id FROM skin_profiles WHERE user_id = ?', [req.user.id]);
  if (existing) {
    await pool.query('UPDATE skin_profiles SET skin_type=?, primary_concern=?, allergy_ingredients=? WHERE user_id=?', [
      skin_type, primary_concern || null, allergy_ingredients || null, req.user.id,
    ]);
  } else {
    await pool.query('INSERT INTO skin_profiles (user_id, skin_type, primary_concern, allergy_ingredients) VALUES (?,?,?,?)', [
      req.user.id, skin_type, primary_concern || null, allergy_ingredients || null,
    ]);
  }
  res.json({ message: 'Đã lưu kết quả khám phá làn da.' });
});

// PUT /api/profile/password
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const full = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, full.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ message: 'Đổi mật khẩu thành công.' });
});

module.exports = router;

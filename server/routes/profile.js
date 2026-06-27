// server/routes/profile.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { get, pool } = require('../db/database');
const { verifyToken } = require('../middleware/auth');
<<<<<<< HEAD
=======
const { isValidPhone, isValidPlaceName, isValidAddressLine, isStrongPassword } = require('../utils/validators');
>>>>>>> 67673ed (Nội dung cập nhật)

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
<<<<<<< HEAD
=======

  if (phone !== undefined && phone !== '' && phone !== null && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ — phải gồm đúng 10 số và bắt đầu bằng số 0.' });
  }
  if (recipient_phone !== undefined && recipient_phone !== '' && recipient_phone !== null && !isValidPhone(recipient_phone)) {
    return res.status(400).json({ error: 'Số điện thoại người nhận không hợp lệ — phải gồm đúng 10 số, không chứa chữ.' });
  }
  if (province_city !== undefined && province_city !== '' && province_city !== null && !isValidPlaceName(province_city)) {
    return res.status(400).json({ error: 'Tỉnh/Thành phố không hợp lệ — không được chỉ nhập số.' });
  }
  if (ward !== undefined && ward !== '' && ward !== null && !isValidPlaceName(ward)) {
    return res.status(400).json({ error: 'Phường/Xã không hợp lệ — không được chỉ nhập số.' });
  }
  if (specific_address !== undefined && specific_address !== '' && specific_address !== null && !isValidAddressLine(specific_address)) {
    return res.status(400).json({ error: 'Địa chỉ cụ thể không hợp lệ — vui lòng nhập đầy đủ số nhà, đường.' });
  }

>>>>>>> 67673ed (Nội dung cập nhật)
  await pool.query(
    `UPDATE users SET full_name=?, phone=?, recipient_name=?, recipient_phone=?, province_city=?, ward=?, specific_address=? WHERE id=?`,
    [
      full_name || req.user.full_name,
<<<<<<< HEAD
      phone ?? req.user.phone,
      recipient_name ?? req.user.recipient_name,
      recipient_phone ?? req.user.recipient_phone,
      province_city ?? req.user.province_city,
      ward ?? req.user.ward,
      specific_address ?? req.user.specific_address,
=======
      phone || req.user.phone,
      recipient_name ?? req.user.recipient_name,
      recipient_phone || req.user.recipient_phone,
      province_city || req.user.province_city,
      ward || req.user.ward,
      specific_address || req.user.specific_address,
>>>>>>> 67673ed (Nội dung cập nhật)
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
<<<<<<< HEAD
  const full = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, full.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
=======
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
  }
  const full = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

  let matches = false;
  try {
    matches = bcrypt.compareSync(currentPassword, full.password_hash || '');
  } catch (err) {
    matches = false; // hash không hợp lệ (vd dữ liệu demo) -> luôn coi là sai, không cho đổi
  }
  if (!matches) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }

>>>>>>> 67673ed (Nội dung cập nhật)
  const hash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ message: 'Đổi mật khẩu thành công.' });
});

module.exports = router;

// server/routes/products.js
const express = require('express');
const { query, get, pool } = require('../db/database');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories  (category_name là cột text trong products, không có bảng riêng)
router.get('/categories', async (req, res) => {
  const rows = await query(
    `SELECT category_name, COUNT(*) as product_count FROM products WHERE is_active = 1 GROUP BY category_name ORDER BY category_name`
  );
  res.json(rows);
});

// GET /api/brands
router.get('/brands', async (req, res) => {
  const rows = await query(
    `SELECT brand_name, COUNT(*) as product_count FROM products WHERE is_active = 1 GROUP BY brand_name ORDER BY brand_name`
  );
  res.json(rows);
});

function withRatingSql(whereSql) {
  return `
    SELECT p.*,
           ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
           COUNT(r.id) as review_count
    FROM products p
    LEFT JOIN reviews r ON r.product_id = p.id AND r.is_hidden = 0
    ${whereSql}
    GROUP BY p.id
  `;
}

// GET /api/products?q=&category=&brand=&minPrice=&maxPrice=&sort=
router.get('/products', async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, sort } = req.query;
  const conditions = ['p.is_active = 1'];
  const params = [];

  if (q) { conditions.push('(p.name LIKE ? OR p.ingredients LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { conditions.push('p.category_name = ?'); params.push(category); }
  if (brand) { conditions.push('p.brand_name = ?'); params.push(brand); }
  if (minPrice) { conditions.push('p.price >= ?'); params.push(Number(minPrice)); }
  if (maxPrice) { conditions.push('p.price <= ?'); params.push(Number(maxPrice)); }

  const whereSql = 'WHERE ' + conditions.join(' AND ');
  const sortMap = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    newest: 'p.created_at DESC',
    rating: 'avg_rating DESC',
    bestselling: 'p.stock_quantity ASC',
  };
  const orderSql = `ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

  const rows = await query(`${withRatingSql(whereSql)} ${orderSql}`, params);
  res.json(rows.map((p) => ({ ...p, in_stock: p.stock_quantity > 0 })));
});

// POST /api/products/recommend  - dùng cho "Khám phá làn da"
// Schema không có cột skin_type/concern trên products, nên đề xuất bằng cách
// dò khớp từ khóa liên quan trong tên / thành phần / danh mục sản phẩm.
const SKIN_TYPE_KEYWORDS = {
  Oily: ['dầu', 'kiềm dầu', 'Niacinamide', 'Salicylic', 'BHA', 'Clay', 'đất sét', 'Cica', 'Tea Tree'],
  Dry: ['khô', 'cấp ẩm', 'Hyaluronic', 'Ceramide', 'dưỡng ẩm', 'Glycerin'],
  Combination: ['hỗn hợp', 'cân bằng', 'Niacinamide', 'Toner'],
  Sensitive: ['nhạy cảm', 'dịu nhẹ', 'Centella', 'Panthenol', 'Cica', 'phục hồi'],
};
const CONCERN_KEYWORDS = {
  'Mụn': ['mụn', 'Salicylic', 'BHA', 'Tea Tree', 'kiềm dầu', 'Niacinamide'],
  'Lão hóa': ['lão hóa', 'nếp nhăn', 'Retinol', 'Collagen', 'Peptide', 'săn chắc'],
  'Thâm nám': ['thâm nám', 'sáng da', 'Vitamin C', 'xỉn màu'],
  'Khô ráp': ['khô ráp', 'cấp ẩm', 'Hyaluronic', 'Ceramide', 'bong tróc'],
  'Lỗ chân lông to': ['lỗ chân lông', 'BHA', 'đất sét', 'Clay'],
};

router.post('/products/recommend', async (req, res) => {
  const { skinType, concerns } = req.body; // skinType: Oily|Dry|Combination|Sensitive ; concerns: string[]
  const concernList = Array.isArray(concerns) ? concerns : (concerns ? [concerns] : []);
  const keywords = [...(SKIN_TYPE_KEYWORDS[skinType] || [])];
  concernList.forEach((c) => keywords.push(...(CONCERN_KEYWORDS[c] || [])));
  if (keywords.length === 0) {
    const rows = await query(`${withRatingSql('WHERE p.is_active = 1')} ORDER BY avg_rating DESC LIMIT 12`);
    return res.json(rows.map((p) => ({ ...p, in_stock: p.stock_quantity > 0 })));
  }
  const likeClauses = keywords.map(() => '(p.name LIKE ? OR p.ingredients LIKE ? OR p.category_name LIKE ?)').join(' OR ');
  const params = [];
  keywords.forEach((k) => params.push(`%${k}%`, `%${k}%`, `%${k}%`));
  const sql = `${withRatingSql(`WHERE p.is_active = 1 AND (${likeClauses})`)} ORDER BY avg_rating DESC LIMIT 12`;
  const rows = await query(sql, params);
  res.json(rows.map((p) => ({ ...p, in_stock: p.stock_quantity > 0 })));
});

// GET /api/products/:sku
router.get('/products/:sku', async (req, res) => {
  const rows = await query(withRatingSql('WHERE p.sku = ?'), [req.params.sku]);
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ ...p, in_stock: p.stock_quantity > 0 });
});

// GET /api/products/:sku/reviews
router.get('/products/:sku/reviews', async (req, res) => {
  const product = await get('SELECT id FROM products WHERE sku = ?', [req.params.sku]);
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  const reviews = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.parent_id, u.full_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.is_hidden = 0 ORDER BY r.created_at DESC`,
    [product.id]
  );
  res.json(reviews);
});

// POST /api/products/:sku/reviews  (yêu cầu đăng nhập)
router.post('/products/:sku/reviews', verifyToken, async (req, res) => {
  const { rating, comment, parent_id } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Điểm đánh giá phải từ 1 đến 5.' });
  const product = await get('SELECT id FROM products WHERE sku = ?', [req.params.sku]);
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, comment, parent_id) VALUES (?, ?, ?, ?, ?)',
    [product.id, req.user.id, rating, comment || null, parent_id || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Đã gửi đánh giá của bạn.' });
});

module.exports = router;

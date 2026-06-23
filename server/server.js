// server/server.js
require('dotenv').config();
require('express-async-errors');
const path = require('path');
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./db/database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes); // /api/products, /api/categories, /api/brands
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (req, res) => {
  const dbOk = await testConnection();
  res.json({ status: dbOk ? 'ok' : 'db_error', time: new Date().toISOString() });
});

// Phục vụ frontend tĩnh
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Bọc lỗi async cho mọi route (tránh unhandled rejection làm crash server)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
});

async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('\n⚠️  Không kết nối được MySQL. Kiểm tra lại file .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    console.error('   và đảm bảo đã chạy: npm run init-db\n');
  }
  app.listen(PORT, () => {
    console.log(`\n💄 NT-II server đang chạy tại http://localhost:${PORT}`);
    console.log(`   Database     : ${process.env.DB_NAME || 'online_NTII'} @ ${process.env.DB_HOST || '127.0.0.1'}`);
    console.log(`   Admin demo   : admin@ntii.vn / admin123`);
    console.log(`   Customer demo: customer@ntii.vn / customer123\n`);
  });
}

start();

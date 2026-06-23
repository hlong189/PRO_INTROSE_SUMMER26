// public/js/api.js
const API_BASE = '/api';

// ---- Auth ----
const Auth = {
  getToken() { return localStorage.getItem('ntii_token'); },
  setToken(t) { localStorage.setItem('ntii_token', t); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('ntii_user') || 'null'); } catch (e) { return null; }
  },
  setUser(u) { localStorage.setItem('ntii_user', JSON.stringify(u)); },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return u && u.role_name === 'Admin'; },
  logout() {
    localStorage.removeItem('ntii_token');
    localStorage.removeItem('ntii_user');
    window.location.href = '/login.html';
  },
};

// ---- Cart (lưu phía client — schema database không có bảng giỏ hàng,
//      giỏ hàng chỉ chuyển thành dữ liệu thật trong DB tại thời điểm đặt hàng) ----
const CartStore = {
  KEY: 'ntii_cart', // { [product_id]: { product_id, name, sku, price, image, quantity, stock_quantity } }
  _read() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch (e) { return {}; }
  },
  _write(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('cart:changed'));
  },
  getAll() {
    return Object.values(this._read());
  },
  count() {
    return this.getAll().reduce((s, i) => s + i.quantity, 0);
  },
  subtotal() {
    return this.getAll().reduce((s, i) => s + i.price * i.quantity, 0);
  },
  add(product, quantity = 1) {
    const data = this._read();
    const key = String(product.id);
    if (data[key]) {
      data[key].quantity = Math.min(data[key].quantity + quantity, product.stock_quantity);
    } else {
      data[key] = {
        product_id: product.id, name: product.name, sku: product.sku,
        price: Number(product.price), quantity: Math.min(quantity, product.stock_quantity),
        stock_quantity: product.stock_quantity,
      };
    }
    this._write(data);
  },
  setQuantity(productId, quantity) {
    const data = this._read();
    const key = String(productId);
    if (!data[key]) return;
    if (quantity <= 0) delete data[key];
    else data[key].quantity = Math.min(quantity, data[key].stock_quantity);
    this._write(data);
  },
  remove(productId) {
    const data = this._read();
    delete data[String(productId)];
    this._write(data);
  },
  clear() { this._write({}); },
};

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || 'Đã xảy ra lỗi.');
    err.status = res.status;
    throw err;
  }
  return data;
}

async function apiUpload(path, formData) {
  const headers = {};
  if (Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi tải lên.');
  return data;
}

function formatVND(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
}

function showToast(message, type = 'default') {
  let el = document.getElementById('lumiere-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lumiere-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.style.background = type === 'error' ? 'var(--color-error)' : 'var(--color-on-surface)';
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
  }
}

function requireAdmin() {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    window.location.href = '/login.html';
  }
}

// ---- Shared Navbar ----
function renderNavbar(active = '') {
  const mount = document.getElementById('navbar-mount');
  if (!mount) return;
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();
  const navLink = (href, label, key) =>
    `<a href="${href}" class="text-sm font-medium px-1 pb-1 ${active === key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}">${label}</a>`;

  mount.innerHTML = `
  <header class="sticky top-0 z-50 glass-effect border-b border-outline-variant">
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
      <a href="/index.html" class="font-display text-2xl font-semibold text-primary">NT-II</a>
      <nav class="hidden md:flex items-center gap-7">
        ${navLink('/index.html', 'Trang chủ', 'home')}
        ${navLink('/products.html', 'Sản phẩm', 'products')}
        ${navLink('/skin-quiz.html', 'Khám phá làn da', 'quiz')}
      </nav>
      <div class="flex items-center gap-3">
        <a href="/products.html" class="material-symbols-outlined text-on-surface" title="Tìm kiếm">search</a>
        <a href="/cart.html" class="material-symbols-outlined text-on-surface relative" title="Giỏ hàng">
          shopping_bag
          <span id="cart-badge" class="hidden absolute -top-2 -right-2 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"></span>
        </a>
        ${loggedIn ? `
          <div class="relative group">
            <button class="flex items-center gap-1 text-sm font-medium">
              <span class="material-symbols-outlined">account_circle</span>
            </button>
            <div class="absolute right-0 top-8 hidden group-hover:block card shadow-lg min-w-[180px] py-2 text-sm">
              <a href="/profile.html" class="block px-4 py-2 hover:bg-secondary-container/40">Hồ sơ của tôi</a>
              <a href="/order-history.html" class="block px-4 py-2 hover:bg-secondary-container/40">Lịch sử mua hàng</a>
              ${user && user.role_name === 'Admin' ? '<a href="/admin-dashboard.html" class="block px-4 py-2 hover:bg-secondary-container/40">Quản trị</a>' : ''}
              <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2 text-error hover:bg-secondary-container/40">Đăng xuất</button>
            </div>
          </div>
        ` : `<a href="/login.html" class="btn-ghost text-sm">Đăng nhập</a>`}
      </div>
    </div>
  </header>`;

  updateCartBadge();
  document.addEventListener('cart:changed', updateCartBadge);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = CartStore.count();
  if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

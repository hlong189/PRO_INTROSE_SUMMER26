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

<<<<<<< HEAD
// ---- Cart (lưu phía client — schema database không có bảng giỏ hàng,
//      giỏ hàng chỉ chuyển thành dữ liệu thật trong DB tại thời điểm đặt hàng) ----
const CartStore = {
  KEY: 'ntii_cart', // { [product_id]: { product_id, name, sku, price, image, quantity, stock_quantity } }
  _read() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch (e) { return {}; }
  },
  _write(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
=======
// ---- Cart (lưu phía client, TÁCH RIÊNG theo từng tài khoản đăng nhập —
//      khắc phục lỗi "giỏ hàng các tài khoản liên thông với nhau") ----
const CartStore = {
  _cartKey() {
    const user = Auth.getUser();
    return 'ntii_cart_' + (user ? user.id : 'guest');
  },
  _read() {
    try { return JSON.parse(localStorage.getItem(this._cartKey()) || '{}'); } catch (e) { return {}; }
  },
  _write(data) {
    localStorage.setItem(this._cartKey(), JSON.stringify(data));
>>>>>>> 67673ed (Nội dung cập nhật)
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
<<<<<<< HEAD
        product_id: product.id, name: product.name, sku: product.sku,
=======
        product_id: product.id, name: product.name, sku: product.sku, category_name: product.category_name,
>>>>>>> 67673ed (Nội dung cập nhật)
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

<<<<<<< HEAD
=======
// ---- Hạn sử dụng sau khi mở nắp (PAO - Period After Opening) ----
// Schema gốc không có cột lưu PAO, nên ước tính theo thông lệ ngành mỹ phẩm dựa trên danh mục.
const PAO_BY_CATEGORY = {
  'Sữa rửa mặt': '12 tháng',
  'Serum & Tinh chất': '6 tháng',
  'Kem dưỡng ẩm': '12 tháng',
  'Kem chống nắng': '12 tháng',
  'Toner & Nước cân bằng': '12 tháng',
  'Mặt nạ': '3 tháng (dùng ngay sau khi mở gói lẻ)',
};
function getPAO(categoryName) {
  return PAO_BY_CATEGORY[categoryName] || '12 tháng (tham khảo, xem thêm trên bao bì sản phẩm)';
}

// ---- Đo độ mạnh mật khẩu (Yếu / Trung bình / Mạnh) ----
function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-zà-ỹ]/.test(password) && /[A-ZÀ-Ỹ]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-zÀ-ỹà-ỹ0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Yếu', color: 'var(--color-error)' };
  if (score <= 3) return { score, label: 'Trung bình', color: '#c98a1f' };
  return { score, label: 'Mạnh', color: '#3a8a5c' };
}

// Gắn thước đo độ mạnh mật khẩu vào 1 input có sẵn. Tạo thanh hiển thị ngay dưới input đó.
function attachPasswordStrengthMeter(inputEl) {
  const meter = document.createElement('div');
  meter.className = 'mt-2';
  meter.innerHTML = `
    <div class="flex gap-1 h-1.5 mb-1">
      ${[0,1,2,3,4].map(i => `<div data-bar="${i}" class="flex-1 rounded-full bg-outline-variant transition-colors"></div>`).join('')}
    </div>
    <p class="text-xs" data-label></p>`;
  inputEl.insertAdjacentElement('afterend', meter);

  inputEl.addEventListener('input', () => {
    const { score, label, color } = passwordStrength(inputEl.value);
    meter.querySelectorAll('[data-bar]').forEach((bar, i) => {
      bar.style.backgroundColor = i < score ? color : '';
      if (i >= score) bar.classList.add('bg-outline-variant');
      else bar.classList.remove('bg-outline-variant');
    });
    const labelEl = meter.querySelector('[data-label]');
    labelEl.textContent = inputEl.value ? `Độ mạnh mật khẩu: ${label}` : '';
    labelEl.style.color = color || '';
  });
}

>>>>>>> 67673ed (Nội dung cập nhật)
function formatVND(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
}

function showToast(message, type = 'default') {
<<<<<<< HEAD
  let el = document.getElementById('lumiere-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lumiere-toast';
=======
  let el = document.getElementById('ntii-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ntii-toast';
>>>>>>> 67673ed (Nội dung cập nhật)
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.style.background = type === 'error' ? 'var(--color-error)' : 'var(--color-on-surface)';
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

<<<<<<< HEAD
=======
// ---- Modal xác nhận tùy chỉnh (thay cho window.confirm() của trình duyệt) ----
function confirmModal(message, { title = 'Xác nhận', confirmText = 'Đồng ý', cancelText = 'Hủy', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="card bg-white w-full max-w-sm p-6">
        <h3 class="font-display text-lg font-semibold mb-2">${title}</h3>
        <p class="text-sm text-on-surface-variant mb-6">${message}</p>
        <div class="flex gap-3">
          <button data-action="cancel" class="btn-ghost flex-1">${cancelText}</button>
          <button data-action="confirm" class="flex-1 ${danger ? '' : 'btn-primary'}" ${danger ? 'style="background:var(--color-error);color:#fff;border-radius:0.25rem;font-weight:600;"' : ''}>${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.dataset.action === 'cancel') {
        overlay.remove();
        resolve(false);
      } else if (e.target.dataset.action === 'confirm') {
        overlay.remove();
        resolve(true);
      }
    });
  });
}

// ---- Validate dùng chung (đồng bộ logic với backend) ----
const Validate = {
  phone(v) { return /^0\d{9}$/.test(String(v || '').trim()); },
  strongPassword(v) {
    if (!v || v.length < 8) return false;
    return /[A-Za-zÀ-ỹà-ỹ]/.test(v) && /\d/.test(v) && /[^A-Za-zÀ-ỹà-ỹ0-9]/.test(v);
  },
  fullName(v) {
    if (!v) return false;
    const t = v.trim().replace(/\s+/g, ' ');
    return /^[A-Za-zÀ-ỹà-ỹ]+(\s[A-Za-zÀ-ỹà-ỹ]+)+$/.test(t);
  },
  placeName(v) {
    if (!v) return false;
    const t = v.trim();
    if (t.length < 2) return false;
    if (/^\d+$/.test(t)) return false;
    return /[A-Za-zÀ-ỹà-ỹ]/.test(t);
  },
  addressLine(v) {
    if (!v) return false;
    const t = v.trim();
    return t.length >= 4 && /[A-Za-zÀ-ỹà-ỹ0-9]/.test(t);
  },
};

>>>>>>> 67673ed (Nội dung cập nhật)
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
<<<<<<< HEAD
          <div class="relative group">
            <button class="flex items-center gap-1 text-sm font-medium">
              <span class="material-symbols-outlined">account_circle</span>
            </button>
            <div class="absolute right-0 top-8 hidden group-hover:block card shadow-lg min-w-[180px] py-2 text-sm">
              <a href="/profile.html" class="block px-4 py-2 hover:bg-secondary-container/40">Hồ sơ của tôi</a>
              <a href="/order-history.html" class="block px-4 py-2 hover:bg-secondary-container/40">Lịch sử mua hàng</a>
              ${user && user.role_name === 'Admin' ? '<a href="/admin-dashboard.html" class="block px-4 py-2 hover:bg-secondary-container/40">Quản trị</a>' : ''}
              <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2 text-error hover:bg-secondary-container/40">Đăng xuất</button>
=======
          <div class="relative" id="user-menu-wrap">
            <button id="user-menu-btn" type="button" class="flex items-center gap-1 text-sm font-medium p-1.5 -m-1.5 rounded hover:bg-secondary-container/40">
              <span class="material-symbols-outlined">account_circle</span>
            </button>
            <div id="user-menu-dropdown" class="hidden absolute right-0 top-full mt-2 card shadow-lg min-w-[200px] py-2 text-sm z-50">
              <a href="/profile.html" class="block px-4 py-2.5 hover:bg-secondary-container/40">Hồ sơ của tôi</a>
              <a href="/order-history.html" class="block px-4 py-2.5 hover:bg-secondary-container/40">Lịch sử mua hàng</a>
              ${user && user.role_name === 'Admin' ? '<a href="/admin-dashboard.html" class="block px-4 py-2.5 hover:bg-secondary-container/40">Quản trị</a>' : ''}
              <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2.5 text-error hover:bg-secondary-container/40">Đăng xuất</button>
>>>>>>> 67673ed (Nội dung cập nhật)
            </div>
          </div>
        ` : `<a href="/login.html" class="btn-ghost text-sm">Đăng nhập</a>`}
      </div>
    </div>
  </header>`;

<<<<<<< HEAD
=======
  // Click để mở/đóng menu (thay cho hover khó bấm), bấm ra ngoài để đóng lại
  const menuBtn = document.getElementById('user-menu-btn');
  const menuDropdown = document.getElementById('user-menu-dropdown');
  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!document.getElementById('user-menu-wrap').contains(e.target)) {
        menuDropdown.classList.add('hidden');
      }
    });
  }

>>>>>>> 67673ed (Nội dung cập nhật)
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

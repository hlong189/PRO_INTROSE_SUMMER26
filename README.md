# NT-II — Website bán mỹ phẩm Fullstack (MySQL)

<<<<<<< HEAD
Dự án fullstack hoàn chỉnh cho hệ thống bán mỹ phẩm online **NT-II**, xây dựng **đúng theo database gốc ** (`SE_NTII.sql`).
=======
Dự án fullstack hoàn chỉnh cho hệ thống bán mỹ phẩm online **NT-II**, xây dựng **đúng theo database gốc của bạn** (`SE_NTII.sql`) — không tự thêm bảng nào ngoài schema bạn cung cấp.
>>>>>>> 67673ed (Nội dung cập nhật)

- **Backend:** Node.js + Express + **MySQL/MariaDB** (driver `mysql2`)
- **Frontend:** HTML + TailwindCSS (CDN) + JavaScript thuần (gọi API qua `fetch`)
- **Xác thực:** JWT + mật khẩu mã hoá bằng bcrypt, phân quyền theo bảng `roles` (chỉ dùng **Admin** và **Customer**)
- **Database:** Dùng đúng 12 bảng trong `SE_NTII.sql`: `roles, users, suppliers, products, inventory_batches, vouchers, orders, order_items, payments, shippings, skin_profiles, reviews`

<<<<<<< HEAD
##  Yêu cầu hệ thống
=======
## ⚙️ Yêu cầu hệ thống
>>>>>>> 67673ed (Nội dung cập nhật)

- Node.js >= 18
- MySQL >= 5.7 hoặc MariaDB >= 10.4 (XAMPP / WAMP / Docker / hoặc server cài sẵn đều dùng được)

<<<<<<< HEAD
##  Sửa lỗi "Access denied for user 'root'@'localhost'"
=======
## 🔧 Sửa lỗi "Access denied for user 'root'@'localhost'"
>>>>>>> 67673ed (Nội dung cập nhật)

Nếu khi chạy `npm start` bạn gặp lỗi:

```
<<<<<<< HEAD
 Không kết nối được MySQL: Access denied for user 'root'@'localhost' (using password: NO)
=======
❌ Không kết nối được MySQL: Access denied for user 'root'@'localhost' (using password: NO)
>>>>>>> 67673ed (Nội dung cập nhật)
```

Nghĩa là MySQL trên máy bạn **có đặt mật khẩu cho root**, nhưng file `.env` đang để trống mật khẩu. Mở file `.env` ở thư mục gốc và điền đúng mật khẩu MySQL của bạn vào `DB_PASSWORD`, ví dụ:

```env
DB_PASSWORD=Long1809@
```

Lưu file rồi chạy lại `npm start`. Nếu chưa có file `.env`, copy từ `.env.example` trước.

<<<<<<< HEAD
##  Cài đặt & chạy dự án
=======
## 🚀 Cài đặt & chạy dự án
>>>>>>> 67673ed (Nội dung cập nhật)

### 1. Cấu hình kết nối database

Tạo file `.env` ở thư mục gốc (copy từ `.env.example`), điền đúng `DB_PASSWORD` của MySQL trên máy bạn:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Long1809@
DB_NAME=online_NTII
JWT_SECRET=doi-chuoi-bi-mat-nay-khi-deploy-thuc-te
PORT=3000
```

### 2. Khởi tạo database + nhập dữ liệu

Có 2 lựa chọn:

**A. Dùng dữ liệu mẫu nhỏ (15 sản phẩm, 3 tài khoản)** — phù hợp để demo nhanh:
```bash
npm install
npm run setup       # = npm run init-db + npm run seed
```

**B. Dùng dữ liệu THẬT từ file CSV (50 sản phẩm, 50 khách hàng, 50 đơn hàng, đánh giá, lô hàng...)** — phù hợp để báo cáo/đồ án có dữ liệu phong phú:
```bash
npm install
npm run setup-real-data    # = npm run init-db + npm run import-dataset + npm run ensure-demo-users
```

<<<<<<< HEAD
>  Dataset thật có `password_hash` là dữ liệu giả lập (không phải bcrypt) nên **không đăng nhập được** bằng các email trong dataset. Lệnh `ensure-demo-users` sẽ tự thêm 3 tài khoản đăng nhập được bên cạnh dữ liệu đã nhập, không ảnh hưởng tới 50 user gốc.
=======
> ⚠️ Dataset thật có `password_hash` là dữ liệu giả lập (không phải bcrypt) nên **không đăng nhập được** bằng các email trong dataset. Lệnh `ensure-demo-users` sẽ tự thêm 3 tài khoản đăng nhập được bên cạnh dữ liệu đã nhập, không ảnh hưởng tới 50 user gốc.
>>>>>>> 67673ed (Nội dung cập nhật)

### 3. Chạy server

```bash
npm start
```

Mở trình duyệt tại: **http://localhost:3000**

### Tài khoản demo (đăng nhập được, dù dùng cách A hay B)

Hệ thống chỉ dùng **2 phân quyền**: Admin và Customer.

| Vai trò (roles.role_name) | Email | Mật khẩu |
|---|---|---|
| Admin | admin@ntii.vn | admin123 |
| Customer | customer@ntii.vn | customer123 |

<<<<<<< HEAD
###  Nếu vẫn không đăng nhập được / không có sản phẩm nào
=======
### 🆘 Nếu vẫn không đăng nhập được / không có sản phẩm nào
>>>>>>> 67673ed (Nội dung cập nhật)

Nghĩa là database đang **trống** (mới chạy `init-db` chứ chưa `seed`/`import-dataset`, hoặc đã chạy nhưng bị lỗi giữa đường). Chạy lệnh sau để **xóa sạch và tạo lại từ đầu** trong 1 lệnh duy nhất:

```bash
npm run reset-db -- --real     # dùng dataset thật (50 sản phẩm...)
# hoặc
npm run reset-db               # dùng dữ liệu mẫu nhỏ (15 sản phẩm)
```

Lệnh này tự DROP database cũ, tạo lại từ `SE_NTII.sql`, rồi nhập dữ liệu — đảm bảo sạch 100% kể cả khi lần chạy trước bị lỗi giữa đường.

<<<<<<< HEAD
##  Cấu trúc dự án
=======
## 📂 Cấu trúc dự án
>>>>>>> 67673ed (Nội dung cập nhật)

```
ntii-shop/
├── server/
│   ├── server.js                # Điểm khởi động Express
│   ├── db/
│   │   ├── SE_NTII.sql          # File database GỐC của bạn — không chỉnh sửa cấu trúc
│   │   ├── database.js          # Kết nối MySQL (mysql2/promise pool)
│   │   ├── init-schema.js       # Script chạy SE_NTII.sql để tạo database
│   │   ├── seed.js              # Dữ liệu mẫu nhỏ (roles, users, suppliers, products, vouchers...)
│   │   ├── dataset/             # 13 file CSV dữ liệu THẬT (50 sản phẩm, 50 đơn hàng...)
│   │   ├── import-dataset.js    # Nhập toàn bộ dataset/*.csv vào 12 bảng đúng thứ tự khóa ngoại
│   │   ├── ensure-demo-users.js # Thêm 2 tài khoản đăng nhập được bên cạnh dataset thật
│   │   └── reset-db.js          # Xóa sạch + tạo lại database từ đầu trong 1 lệnh (npm run reset-db)
│   ├── middleware/auth.js       # JWT + phân quyền theo bảng roles
│   └── routes/
│       ├── auth.js              # Đăng ký / Đăng nhập / Quên mật khẩu
│       ├── products.js          # Sản phẩm, danh mục, nhãn hàng, đánh giá, đề xuất theo da
│       ├── orders.js            # Đặt hàng (orders+order_items+payments+shippings), lịch sử, voucher
│       ├── profile.js           # Hồ sơ, địa chỉ nhận hàng, hồ sơ làn da (skin_profiles)
│       └── admin.js             # Dashboard, CRUD sản phẩm, nhà cung cấp, lô hàng, đơn hàng, NHẬP CSV
└── public/                      # Toàn bộ giao diện (15 màn hình)
```

<<<<<<< HEAD
##  Cách dữ liệu được ánh xạ vào schema gốc của bạn
=======
## 🗄️ Cách dữ liệu được ánh xạ vào schema gốc của bạn
>>>>>>> 67673ed (Nội dung cập nhật)

Vì schema `SE_NTII.sql` được thiết kế rất chuẩn hoá, một số chức năng được triển khai như sau để **không cần thêm bảng nào**:

| Chức năng | Cách triển khai trên schema của bạn |
|---|---|
| Phân quyền Admin/Staff/Customer | Join `users.role_id` → `roles.role_name` |
| Danh mục / Nhãn hàng sản phẩm | Lấy `DISTINCT category_name` / `brand_name` trực tiếp từ bảng `products` (không có bảng categories riêng) |
| Giỏ hàng | **Lưu ở phía trình duyệt (localStorage)** — schema không có bảng cart, giỏ hàng chỉ trở thành dữ liệu thật trong `orders`/`order_items` tại thời điểm bấm "Đặt hàng" |
| Địa chỉ giao hàng | Lưu trong các cột `recipient_*`, `province_city`, `ward`, `specific_address` của bảng `users` (địa chỉ mặc định, không lưu theo từng đơn) |
| Quên mật khẩu | Dùng JWT ngắn hạn làm mã khôi phục (stateless) — schema không có bảng `password_resets` |
| Đề xuất theo loại da ("Khám phá làn da") | `skin_profiles.skin_type` (ENUM Oily/Dry/Combination/Sensitive) được lưu khi làm trắc nghiệm; sản phẩm đề xuất bằng cách dò từ khóa liên quan trong `products.name` / `ingredients` / `category_name` (schema không có cột skin_type trên products) |
| Ảnh sản phẩm | Schema không có cột lưu ảnh — giao diện hiển thị ảnh minh họa từ `picsum.photos` theo `sku` (không lưu trong DB) |
| Nhập kho | Tạo dòng mới trong `inventory_batches` (gắn `supplier_id`) → tự động **cộng** vào `products.stock_quantity` |
| Tích điểm thành viên | Sau khi đặt hàng, cộng điểm vào `users.accumulated_points` và tự nâng `membership_level` (Bronze→Silver→Gold→Diamond) |

<<<<<<< HEAD
##  Nhập dữ liệu vào Database
=======
## 📥 Nhập dữ liệu vào Database
>>>>>>> 67673ed (Nội dung cập nhật)

### Cách 1: Nhập trọn bộ dataset thật (CSV) — `npm run import-dataset`
Project đã kèm 13 file CSV thật trong `server/db/dataset/` (50 sản phẩm, 50 khách hàng, 50 đơn hàng, 128 mục đơn hàng, đánh giá, lô hàng, voucher...). Script `import-dataset.js` sẽ:
- Xóa sạch dữ liệu cũ trong 12 bảng (TRUNCATE theo đúng thứ tự an toàn)
- Nhập lại từ CSV theo đúng thứ tự khóa ngoại: `roles → users → suppliers → products → inventory_batches → vouchers → orders → order_items → payments → shippings → skin_profiles → reviews`

```bash
npm run import-dataset
npm run ensure-demo-users   # thêm tài khoản đăng nhập được (xem lưu ý ở mục cài đặt)
```

Muốn dùng dataset CSV khác (export từ MySQL Workbench/phpMyAdmin của bạn), chỉ cần thay file trong `server/db/dataset/` đúng tên và format tương tự rồi chạy lại lệnh trên.

### Cách 2: Qua giao diện Admin (thêm từng phần, không xóa dữ liệu cũ)
1. Đăng nhập admin → **Quản lý kho** → tab **Sản phẩm**
2. Bấm **"⇪ Nhập CSV"** → chọn file → **Nhập dữ liệu**

File mẫu: `sample_products_import.csv`. Cột bắt buộc:

```
sku,name,category_name,brand_name,price,original_price,stock_quantity,ingredients,usage_instructions
```

Sản phẩm trùng `sku` sẽ được **cập nhật**, sản phẩm mới sẽ được **thêm thẳng vào database**.

### Cách 3: Thêm/sửa từng sản phẩm trực tiếp
Trong tab **Sản phẩm**, bấm **"+ Thêm sản phẩm"** hoặc icon ✏️ để sửa — lưu thẳng vào MySQL.

### Cách 4: Nhập kho theo lô hàng (đúng nghiệp vụ `inventory_batches`)
Tab **Nhập kho (Lô hàng)** → **"+ Nhập kho"** → chọn sản phẩm, nhà cung cấp, số lượng, giá nhập, ngày hết hạn → tồn kho sản phẩm tự động cộng thêm.

### Cách 5: Sửa file `server/db/seed.js`
Thêm sản phẩm vào danh sách rồi chạy lại `npm run seed` (an toàn — dùng "upsert" theo `sku`/`email`, không tạo trùng lặp).

## 🔌 API chính

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` / `/login` / `/forgot-password` / `/reset-password` | Xác thực |
| GET | `/api/products`, `/api/categories`, `/api/brands` | Danh sách + bộ lọc |
| POST | `/api/products/recommend` | Đề xuất theo "Khám phá làn da" |
| GET/POST | `/api/products/:sku/reviews` | Đánh giá sản phẩm |
| POST | `/api/orders` | Đặt hàng (tạo order + order_items + payments + shippings) |
| POST | `/api/orders/validate-voucher` | Kiểm tra mã giảm giá |
| GET | `/api/orders` | Lịch sử mua hàng |
| PUT | `/api/orders/:id/cancel` | Hủy đơn hàng |
| GET/PUT | `/api/profile`, `/api/profile/skin` | Hồ sơ & hồ sơ làn da |
| GET | `/api/admin/stats` | Số liệu Dashboard |
| CRUD | `/api/admin/products`, `/api/admin/suppliers`, `/api/admin/batches` | Quản lý kho |
| POST | `/api/admin/products/import` | Nhập CSV vào database |
| GET/PUT | `/api/admin/orders`, `/api/admin/orders/:id/status` | Quản lý đơn hàng & vận chuyển |
| CRUD | `/api/admin/vouchers` | Quản lý mã giảm giá |

<<<<<<< HEAD
##  Lưu ý

- "Quên mật khẩu" trả `resetToken` trực tiếp trên UI vì chưa tích hợp dịch vụ gửi email thật — khi triển khai thật, hãy gửi token này qua email thay vì hiển thị.
- Phương thức thanh toán VNPay/Momo/Bank_Transfer hiện là **mô phỏng** (chưa gọi API cổng thanh toán thật), nhưng trạng thái được lưu đúng vào bảng `payments`.
- Muốn khởi tạo lại database từ đầu: `DROP DATABASE online_NTII;` rồi chạy lại `npm run setup`.
#   P R O _ I N T R O S E _ S U M M E R 2 6  
 
=======
## ✅ Đã khắc phục theo báo cáo review (PDHT_Review_SE)

| Module | Đã sửa |
|---|---|
| **M1 - Người dùng** | Mã khôi phục rút về đúng 6 số (hết hạn 10 phút) · Validate họ tên (chỉ chữ) · SĐT bắt buộc đúng 10 số · Mật khẩu bắt buộc ≥8 ký tự gồm chữ/số/ký tự đặc biệt · Validate SĐT/Tỉnh-Thành/Phường-Xã khi cập nhật hồ sơ · Đổi mật khẩu chặn đúng khi sai mật khẩu cũ + bắt buộc mật khẩu mới khác mật khẩu cũ · Thêm khóa/mở khóa tài khoản vi phạm (tab Khách hàng) |
| **M2 - Sản phẩm** | SKU tự gợi ý theo danh mục (`SKU-DANHMUC-0001`) · Danh mục/Nhãn hàng chọn từ danh sách có sẵn (datalist) · Validate giá bán/giá gốc/tồn kho không âm · Modal xác nhận khi xóa sản phẩm · Thêm nút "Hiện lại" cho sản phẩm đã ẩn · Bỏ số lượng trong dropdown lọc · Thêm tab Khuyến mãi (tạo voucher theo chiến dịch) |
| **M3 - Giỏ hàng & Đơn hàng** | **Giỏ hàng tách riêng theo từng tài khoản** (sửa lỗi nghiêm trọng liên thông giữa các account) · Modal xác nhận khi giảm số lượng về 0 · Sửa lỗi nhập số lượng >9 bị cắt số · Mã giảm giá chọn từ dropdown thay vì nhập tay · Validate Tỉnh-Thành/Phường-Xã không được chỉ là số · VNPay/Momo/Chuyển khoản hiện mã QR/thông tin thanh toán + bắt xác nhận trước khi hoàn tất đơn · Modal xác nhận khi hủy đơn |
| **M4 - Kho & Báo cáo** | Validate số lượng/giá nhập kho không âm · Mã lô hàng bắt buộc duy nhất (báo lỗi nếu trùng) · Thêm mục "Đề xuất hàng cần nhập" theo tồn kho thấp + nhà cung cấp gần nhất |
| **M5 - Đánh giá** | Chỉ cho đánh giá nếu đã mua và đơn ở trạng thái Hoàn tất · Bắt buộc chọn sao VÀ nhập nội dung (không còn mặc định 5 sao) · Thêm nút "Đánh giá" ngay trong Lịch sử mua hàng cho đơn đã hoàn tất · Admin có thể phản hồi đánh giá khách hàng (tab Đánh giá) |
| **M6 - Vận chuyển** | Trạng thái vận chuyển tự đồng bộ theo trạng thái đơn hàng · Khi admin chuyển đơn sang Hủy/Trả hàng, tồn kho được hoàn lại tự động · Làm rõ vai trò mã vận đơn (hiển thị ghi chú "dùng để tra cứu với đơn vị vận chuyển") |
| **M7 - Cá nhân hóa** | Khám phá làn da: vào lại trang sẽ hiện đúng kết quả đã lưu trước đó (không bị mất) |

### ⚠️ Chưa thể khắc phục / cần thêm thông tin

- **FR-M7-CN-04 đến FR-M7-CN-11**: báo cáo không nêu rõ nội dung các yêu cầu này — vui lòng cung cấp tài liệu đặc tả chi tiết để mình triển khai đúng.
- **Cập nhật ảnh đại diện**: bảng `users` trong `SE_NTII.sql` không có cột lưu ảnh — cần bổ sung cột (vd. `avatar_url`) nếu muốn có tính năng này.
- **Ghi nhận công nợ nhà cung cấp**: schema hiện chưa có bảng theo dõi công nợ/thanh toán cho nhà cung cấp — cần thiết kế thêm bảng (vd. `supplier_payables`) nếu muốn quản lý đầy đủ.

## ⚠️ Lưu ý khác

- "Quên mật khẩu" trả mã khôi phục trực tiếp trên UI vì chưa tích hợp dịch vụ gửi email thật — khi triển khai thật, hãy gửi mã này qua email thay vì hiển thị.
- Phương thức thanh toán VNPay/Momo/Bank_Transfer hiện là **mô phỏng** (chưa gọi API cổng thanh toán thật), nhưng khách phải xác nhận đã thanh toán trước khi đơn được tạo, và trạng thái được lưu đúng vào bảng `payments`.
- Muốn khởi tạo lại database từ đầu: `npm run reset-db` hoặc `npm run reset-db -- --real`.
>>>>>>> 67673ed (Nội dung cập nhật)

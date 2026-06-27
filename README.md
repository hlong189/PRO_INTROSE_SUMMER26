NT-II — Website bán mỹ phẩm Fullstack (MySQL)Dự án fullstack hoàn chỉnh cho hệ thống bán mỹ phẩm online NT-II, xây dựng đúng theo database gốc của bạn (SE_NTII.sql) — không tự thêm bảng nào ngoài schema bạn cung cấp.Backend: Node.js + Express + MySQL/MariaDB (driver mysql2)Frontend: HTML + TailwindCSS (CDN) + JavaScript thuần (gọi API qua fetch)Xác thực: JWT + mật khẩu mã hoá bằng bcrypt, phân quyền theo bảng roles (chỉ dùng Admin và Customer)Database: Dùng đúng 12 bảng trong SE_NTII.sql: roles, users, suppliers, products, inventory_batches, vouchers, orders, order_items, payments, shippings, skin_profiles, reviews⚙️ Yêu cầu hệ thốngNode.js >= 18MySQL >= 5.7 hoặc MariaDB >= 10.4 (XAMPP / WAMP / Docker / hoặc server cài sẵn đều dùng được)🔧 Sửa lỗi "Access denied for user 'root'@'localhost'"Nếu khi chạy npm start bạn gặp lỗi:❌ Không kết nối được MySQL: Access denied for user 'root'@'localhost' (using password: NO)
Nghĩa là MySQL trên máy bạn có đặt mật khẩu cho root, nhưng file .env đang để trống mật khẩu. Mở file .env ở thư mục gốc và điền đúng mật khẩu MySQL của bạn vào DB_PASSWORD, ví dụ:Đoạn mãDB_PASSWORD=Long1809@
Lưu file rồi chạy lại npm start. Nếu chưa có file .env, copy từ .env.example trước.🚀 Cài đặt & chạy dự án1. Cấu hình kết nối databaseTạo file .env ở thư mục gốc (copy từ .env.example), điền đúng DB_PASSWORD của MySQL trên máy bạn:Đoạn mãDB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Long1809@
DB_NAME=online_NTII
JWT_SECRET=doi-chuoi-bi-mat-nay-khi-deploy-thuc-te
PORT=3000
2. Khởi tạo database + nhập dữ liệuCó 2 lựa chọn:A. Dùng dữ liệu mẫu nhỏ (15 sản phẩm, 3 tài khoản) — phù hợp để demo nhanh:Bashnpm install
npm run setup       # = npm run init-db + npm run seed
B. Dùng dữ liệu THẬT từ file CSV (50 sản phẩm, 50 khách hàng, 50 đơn hàng, đánh giá, lô hàng...) — phù hợp để báo cáo/đồ án có dữ liệu phong phú:Bashnpm install
npm run setup-real-data    # = npm run init-db + npm run import-dataset + npm run ensure-demo-users
⚠️ Dataset thật có password_hash là dữ liệu giả lập (không phải bcrypt) nên không đăng nhập được bằng các email trong dataset. Lệnh ensure-demo-users sẽ tự thêm 3 tài khoản đăng nhập được bên cạnh dữ liệu đã nhập, không ảnh hưởng tới 50 user gốc.3. Chạy serverBashnpm start
Mở trình duyệt tại: http://localhost:3000Tài khoản demo (đăng nhập được, dù dùng cách A hay B)Hệ thống chỉ dùng 2 phân quyền: Admin và Customer.Vai trò (roles.role_name)EmailMật khẩuAdminadmin@ntii.vnadmin123Customercustomer@ntii.vncustomer123🆘 Nếu vẫn không đăng nhập được / không có sản phẩm nàoNghĩa là database đang trống (mới chạy init-db chứ chưa seed/import-dataset, hoặc đã chạy nhưng bị lỗi giữa đường). Chạy lệnh sau để xóa sạch và tạo lại từ đầu trong 1 lệnh duy nhất:Bashnpm run reset-db -- --real     # dùng dataset thật (50 sản phẩm...)
# hoặc
npm run reset-db               # dùng dữ liệu mẫu nhỏ (15 sản phẩm)
Lệnh này tự DROP database cũ, tạo lại từ SE_NTII.sql, rồi nhập dữ liệu — đảm bảo sạch 100% kể cả khi lần chạy trước bị lỗi giữa đường.📂 Cấu trúc dự ánntii-shop/
├── server/
│   ├── server.js              # Điểm khởi động Express
│   ├── db/
│   │   ├── SE_NTII.sql        # File database GỐC của bạn — không chỉnh sửa cấu trúc
│   │   ├── database.js        # Kết nối MySQL (mysql2/promise pool)
│   │   ├── init-schema.js     # Script chạy SE_NTII.sql để tạo database
│   │   ├── seed.js            # Dữ liệu mẫu nhỏ (roles, users, suppliers, products, vouchers...)
│   │   ├── dataset/           # 13 file CSV dữ liệu THẬT (50 sản phẩm, 50 đơn hàng...)
│   │   ├── import-dataset.js  # Nhập toàn bộ dataset/*.csv vào 12 bảng đúng thứ tự khóa ngoại
│   │   ├── ensure-demo-users.js # Thêm 2 tài khoản đăng nhập được bên cạnh dataset thật
│   │   └── reset-db.js        # Xóa sạch + tạo lại database từ đầu trong 1 lệnh (npm run reset-db)
│   ├── middleware/auth.js     # JWT + phân quyền theo bảng roles
│   └── routes/
│       ├── auth.js            # Đăng ký / Đăng nhập / Quên mật khẩu
│       ├── products.js        # Sản phẩm, danh mục, nhãn hàng, đánh giá, đề xuất theo da
│       ├── orders.js          # Đặt hàng (orders+order_items+payments+shippings), lịch sử, voucher
│       ├── profile.js         # Hồ sơ, địa chỉ nhận hàng, hồ sơ làn da (skin_profiles)
│       └── admin.js           # Dashboard, CRUD sản phẩm, nhà cung cấp, lô hàng, đơn hàng, NHẬP CSV
└── public/                    # Toàn bộ giao diện (15 màn hình)
🗄️ Cách dữ liệu được ánh xạ vào schema gốc của bạnVì schema SE_NTII.sql được thiết kế rất chuẩn hoá, một số chức năng được triển khai như sau để không cần thêm bảng nào:Chức năngCách triển khai trên schema của bạnPhân quyền Admin/Staff/CustomerJoin users.role_id → roles.role_nameDanh mục / Nhãn hàng sản phẩmLấy DISTINCT category_name / brand_name trực tiếp từ bảng productsGiỏ hàngLưu ở phía trình duyệt (localStorage) — schema không có bảng cartĐịa chỉ giao hàngLưu trong các cột recipient_*, province_city... của bảng usersQuên mật khẩuDùng JWT ngắn hạn làm mã khôi phục (stateless)Đề xuất theo loại daskin_profiles.skin_type được lưu khi làm trắc nghiệm; lọc sản phẩm bằng từ khóaẢnh sản phẩmHiển thị ảnh minh họa từ picsum.photos theo skuNhập khoTạo dòng mới trong inventory_batches → tự động cộng vào products.stock_quantityTích điểm thành viênCộng điểm vào users.accumulated_points và tự nâng membership_level📥 Nhập dữ liệu vào DatabaseCách 1: Nhập trọn bộ dataset thật (CSV) — npm run import-datasetProject đã kèm 13 file CSV thật trong server/db/dataset/.Bashnpm run import-dataset
npm run ensure-demo-users   # thêm tài khoản đăng nhập được
Cách 2: Qua giao diện AdminĐăng nhập admin → Quản lý kho → tab Sản phẩmBấm "⇪ Nhập CSV" → chọn file → Nhập dữ liệu🔌 API chínhMethodEndpointMô tảPOST/api/auth/register / /loginXác thựcGET/api/productsDanh sách + bộ lọcPOST/api/products/recommendĐề xuất theo làn daPOST/api/ordersĐặt hàngGET/api/admin/statsSố liệu DashboardPOST/api/admin/products/importNhập CSV vào database⚠️ Lưu ý"Quên mật khẩu" trả resetToken trực tiếp trên UI vì chưa tích hợp dịch vụ gửi email thật.Phương thức thanh toán hiện là mô phỏng.Muốn khởi tạo lại database từ đầu: DROP DATABASE online_NTII; rồi chạy lại npm run setup.

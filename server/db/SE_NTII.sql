CREATE DATABASE IF NOT EXISTS online_NTII;
USE online_NTII;

-- =========================================================
-- 1. TÀI KHOẢN & NGƯỜI DÙNG (Gộp Profile vào User)
-- =========================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE, -- Admin, Warehouse_Staff, Customer
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE,
    
    -- Các trường dành riêng cho khách mua hàng (Gộp từ bảng customers cũ)
    membership_level ENUM('Bronze', 'Silver', 'Gold', 'Diamond') DEFAULT 'Bronze',
    accumulated_points INT DEFAULT 0,
    recipient_name VARCHAR(100),          -- Tên người nhận hàng
    recipient_phone VARCHAR(15),          -- SĐT nhận hàng
    province_city VARCHAR(100),           -- Tỉnh/Thành
    ward VARCHAR(100),                    -- Phường/Xã
    specific_address TEXT,                -- Số nhà
    
    status ENUM('Active', 'Suspended', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_online_users_roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 2. HÀNG HÓA & NHÀ CUNG CẤP
-- =========================================================
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(15),
    contact_email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng Products đã gộp cả Brand và Category
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,         
    name VARCHAR(255) NOT NULL,              
    category_name VARCHAR(100) NOT NULL,     -- Gộp từ bảng categories
    brand_name VARCHAR(100) NOT NULL,        -- Gộp từ bảng brands
    price DECIMAL(10, 2) NOT NULL,           
    original_price DECIMAL(10, 2) NOT NULL,  
    stock_quantity INT DEFAULT 0,            
    ingredients TEXT,                        
    usage_instructions TEXT,                 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Lô hàng nhập kho gắn với Nhà cung cấp
CREATE TABLE inventory_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,  
    supplier_id INT NOT NULL,                -- Ràng buộc với nhà cung cấp
    batch_code VARCHAR(50) NOT NULL,
    quantity_imported INT NOT NULL,
    quantity_remaining INT NOT NULL,
    import_price DECIMAL(10, 2) NOT NULL,
    expiration_date DATE NOT NULL,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_online_batches_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_online_batches_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 3. BÁN HÀNG & DÒNG TIỀN
-- =========================================================
CREATE TABLE vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    discount_type ENUM('Percentage', 'Fixed_Amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0.00,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                    -- Đổi từ customer_id thành user_id
    voucher_id INT DEFAULT NULL,
    subtotal_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    shipping_fee DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(12, 2) NOT NULL,
    order_status ENUM('Pending_Payment', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Returned') DEFAULT 'Pending_Payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_online_orders_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_online_orders_vouchers FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,                 
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL, 
    CONSTRAINT fk_online_items_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_online_items_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('COD', 'Bank_Transfer', 'VNPay', 'Momo') NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    gateway_transaction_id VARCHAR(100),
    paid_at DATETIME,
    CONSTRAINT fk_online_payments_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE shippings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    carrier_name VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    shipping_status ENUM('Preparing', 'In_Transit', 'Delivered', 'Delivery_Failed') DEFAULT 'Preparing',
    estimated_delivery_date DATE,
    shipped_at DATETIME,
    CONSTRAINT fk_shippings_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 4. TƯƠNG TÁC (REVIEWS & PROFILES)
-- =========================================================
CREATE TABLE skin_profiles (
    user_id INT PRIMARY KEY,                 -- Đổi từ customer_id thành user_id
    skin_type ENUM('Oily', 'Dry', 'Combination', 'Sensitive') NOT NULL,
    primary_concern VARCHAR(255),
    allergy_ingredients TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_online_skin_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,                    -- Đổi từ customer_id thành user_id
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    parent_id INT DEFAULT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_online_reviews_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_online_reviews_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_online_reviews_parent FOREIGN KEY (parent_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;
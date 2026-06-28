CREATE DATABASE Quan_Ly_Quan_Cafe;
USE Quan_Ly_Quan_Cafe;

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,          
    phone VARCHAR(15),
    role ENUM('MANAGER', 'STAFF') DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- MODULE 1: MENU (THỰC ĐƠN)

CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Using decimal for financial accuracy
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- MODULE 2: TABLE & ORDER (BÀN & ORDER)

CREATE TABLE tables (
    id VARCHAR(36) PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('EMPTY', 'OCCUPIED', 'RESERVED') DEFAULT 'EMPTY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    table_id VARCHAR(36), -- Nullable to allow for Takeaway orders
    user_id VARCHAR(36) NOT NULL, -- Link to your existing 'users' table
    status ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL, -- Captures the item price at the exact moment of order
    note VARCHAR(255), -- For special requests (e.g., "no sugar", "more ice")
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    position VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- MODULE 3: PAYMENT

CREATE TABLE payment_requests (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    code VARCHAR(12) NOT NULL UNIQUE,
    amount DECIMAL(12, 0) NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED') DEFAULT 'PENDING',
    qr_url TEXT NOT NULL,
    sepay_transaction_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
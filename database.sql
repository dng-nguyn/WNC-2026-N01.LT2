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
INSERT INTO users (id, username, password, full_name, phone, role, is_active) VALUES
(UUID(), 'admin', '123456', 'Nguyễn Việt Cường', '0987654321', 'MANAGER', TRUE),
(UUID(), 'nhanvien01', '123456', 'Nguyễn Đình Anh Dũng', '0912345678', 'STAFF', TRUE);
-- FinTrack Pro Database Schema
CREATE DATABASE IF NOT EXISTS fintrack_db;
USE fintrack_db;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER','ADMIN','MODERATOR') DEFAULT 'USER',
    profile_picture LONGTEXT,
    face_embedding LONGTEXT,
    face_enabled BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'INR',
    phone_number VARCHAR(20),
    enabled BOOLEAN DEFAULT TRUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    reset_password_token VARCHAR(255),
    reset_password_token_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('INCOME','EXPENSE') NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100),
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    receipt_image VARCHAR(500),
    recurring BOOLEAN DEFAULT FALSE,
    recurring_period VARCHAR(20),
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    month INT NOT NULL,
    year INT NOT NULL,
    start_date DATE,
    end_date DATE,
    color VARCHAR(20),
    icon VARCHAR(50),
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    saved_amount DECIMAL(15,2) DEFAULT 0,
    deadline DATE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'IN_PROGRESS',
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('INCOME','EXPENSE') NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    user_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO','SUCCESS','WARNING','DANGER') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default categories
INSERT INTO categories (name, type, icon, color, is_default) VALUES
('Salary', 'INCOME', 'fas fa-building', '#10B981', TRUE),
('Freelancing', 'INCOME', 'fas fa-laptop-code', '#2563EB', TRUE),
('Investments', 'INCOME', 'fas fa-chart-line', '#8B5CF6', TRUE),
('Food & Dining', 'EXPENSE', 'fas fa-utensils', '#2563EB', TRUE),
('Travel', 'EXPENSE', 'fas fa-plane', '#10B981', TRUE),
('Shopping', 'EXPENSE', 'fas fa-shopping-bag', '#F59E0B', TRUE),
('Bills & Utilities', 'EXPENSE', 'fas fa-file-invoice', '#8B5CF6', TRUE),
('Entertainment', 'EXPENSE', 'fas fa-film', '#EC4899', TRUE),
('Healthcare', 'EXPENSE', 'fas fa-heartbeat', '#06B6D4', TRUE),
('EMI', 'EXPENSE', 'fas fa-car', '#EF4444', TRUE);

-- Sample admin user (password: Admin@123)
INSERT INTO users (first_name, last_name, email, password, role) VALUES
('Admin', 'User', 'admin@fintrack.com', '$2a$10$8K1p/a0dL1FXMBROfYVnFuSjLqR5lQRyNJf3K0h2nNBPmNKHs8Cdm', 'ADMIN');

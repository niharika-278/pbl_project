-- Retail Inventory & Sales Intelligence - MySQL Schema
-- Run this to create the database and tables

CREATE DATABASE IF NOT EXISTS retail_inventory;
USE retail_inventory;

-- Users (Admin / Seller)
CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'seller') NOT NULL DEFAULT 'seller',
  zip_code VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
);

-- Password reset tokens (for forgot password)
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_reset_token (token),
  INDEX idx_reset_expires (expires_at)
);

-- Categories
CREATE TABLE Categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  INDEX idx_categories_name (name)
);

-- Products
CREATE TABLE Products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_expiry (expiry_date),
  INDEX idx_products_name (name)
);

-- Customers
CREATE TABLE Customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unique_id VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  zip_code VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_email (email),
  INDEX idx_customers_name (name),
  INDEX idx_customers_unique_id (unique_id)
);

-- Orders
CREATE TABLE Orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE RESTRICT,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_created (created_at)
);

-- Inventory (per product per seller)
CREATE TABLE Inventory (
  product_id INT NOT NULL,
  seller_id INT NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, seller_id),
  FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_inventory_seller (seller_id),
  INDEX idx_inventory_stock (stock)
);

-- Order items (with seller_id for attribution)
CREATE TABLE Order_Items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  seller_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT,
  FOREIGN KEY (seller_id) REFERENCES Users(id) ON DELETE RESTRICT,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
);

-- Seed admin: run "node src/scripts/seedAdmin.js" (admin@retail.com / Admin@123)

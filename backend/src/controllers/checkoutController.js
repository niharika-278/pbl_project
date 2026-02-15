import pool from '../config/db.js';
import { transaction } from '../config/db.js';
import { placeOrder } from '../services/checkoutService.js';

export async function getCustomers(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, unique_id, name, phone, email, zip_code, city, state FROM Customers ORDER BY name LIMIT 200'
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function searchCustomers(req, res) {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.execute(
      'SELECT id, unique_id, name, phone, email FROM Customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name LIMIT 50',
      [q, q, q]
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCustomer(req, res) {
  try {
    const { name, phone, email, zip_code, city, state, unique_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO Customers (unique_id, name, phone, email, zip_code, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [unique_id || null, name, phone || null, email || null, zip_code || null, city || null, state || null]
    );
    const [rows] = await pool.execute(
      'SELECT id, unique_id, name, phone, email, zip_code, city, state FROM Customers WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ success: true, data: rows?.[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProducts(req, res) {
  try {
    const sellerId = req.user.id;
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.price, p.expiry_date, c.name AS category_name,
        COALESCE(i.stock, 0) AS stock
       FROM Products p
       JOIN Categories c ON c.id = p.category_id
       LEFT JOIN Inventory i ON i.product_id = p.id AND i.seller_id = ?
       WHERE p.name LIKE ?
       ORDER BY p.name LIMIT 100`,
      [sellerId, q]
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createOrder(req, res) {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'customerId and non-empty items required' });
    }
    const sellerId = req.user.id;
    const normalized = items.map((i) => ({
      productId: Number(i.productId),
      quantity: Number(i.quantity) || 1,
    })).filter((i) => i.productId && i.quantity > 0);

    const result = await transaction(async (conn) => {
      return await placeOrder(conn, { customerId, items: normalized, sellerId });
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const status = err.message?.includes('Insufficient stock') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

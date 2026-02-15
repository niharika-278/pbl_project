import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const password = 'Admin@123';
const hash = await bcrypt.hash(password, 10);
await pool.execute(
  'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
  ['System Admin', 'admin@retail.com', hash, 'admin']
);
console.log('Admin seeded: admin@retail.com / Admin@123');
process.exit(0);

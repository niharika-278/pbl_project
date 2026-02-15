import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import pool from '../config/db.js';

function signToken(id) {
  return jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expire });
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const [existing] = await pool.execute('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing?.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, config.bcryptRounds);
    await pool.execute(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), password_hash, role || 'seller']
    );
    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM Users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    const user = rows?.[0];
    if (!user) return res.status(500).json({ success: false, message: 'Registration failed' });
    const token = signToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM Users WHERE email = ?',
      [email]
    );
    const user = rows?.[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: 'Role mismatch' });
    }
    const token = signToken(user.id);
    delete user.password_hash;
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const [rows] = await pool.execute('SELECT id FROM Users WHERE email = ?', [email]);
    const user = rows?.[0];
    if (!user) {
      return res.status(200).json({ success: true, message: 'If email exists, reset link will be sent' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    // In production: send email with link containing token
    const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;
    res.json({ success: true, message: 'Reset link generated', resetLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const [tokens] = await pool.execute(
      'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = 0',
      [token]
    );
    const resetRecord = tokens?.[0];
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    await pool.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [hash, resetRecord.user_id]);
    await pool.execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetRecord.id]);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function me(req, res) {
  res.json({ success: true, user: req.user });
}

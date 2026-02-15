import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { transaction } from '../config/db.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

function parseCsv(buffer) {
  const text = buffer.toString('utf8').trim();
  const records = parse(text, {
  columns: true,
  skip_empty_lines: true,
  trim: true
  });
  return records;
}

function cleanRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k?.trim?.() ?? k;
    let val = (v ?? '').toString().trim();
    if (val === '' || val.toLowerCase() === 'null') val = null;
    out[key] = val;
  }
  return out;
}

export async function ingestCustomers(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  let processed = 0; let rejected = 0; let cleaned = 0;
  try {
    const rows = parseCsv(req.file.buffer);
    const seen = new Set();
    const toInsert = [];
    for (const row of rows) {
      const r = cleanRow(row);
      const name = r.name || r.Name;
      if (!name) { rejected++; continue; }
      const key = `${(r.email || '').toLowerCase()}-${(r.phone || '')}`;
      if (seen.has(key)) { rejected++; continue; }
      seen.add(key);
      if (r.email === null && r.phone === null) cleaned++;
      toInsert.push({
        unique_id: r.unique_id || r.Unique_id || null,
        name,
        phone: r.phone || r.Phone || null,
        email: r.email || r.Email || null,
        zip_code: r['zip_code'] ?? r['Zip-code'] ?? r.zip_code ?? null,
        city: r.city || r.City || null,
        state: r.state || r.State || null,
      });
    }
    await transaction(async (conn) => {
      for (const r of toInsert) {
        await conn.execute(
          'INSERT INTO Customers (unique_id, name, phone, email, zip_code, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [r.unique_id, r.name, r.phone, r.email, r.zip_code, r.city, r.state]
        );
        processed++;
      }
    });
    res.json({
      success: true,
      summary: { processed, rejected, cleaned, total: rows.length },
      preview: toInsert.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, summary: { processed, rejected, cleaned } });
  }
}

export async function ingestInventory(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  let processed = 0; let rejected = 0;
  const sellerId = req.user.id;
  try {
    const rows = parseCsv(req.file.buffer);
    const toUpsert = [];
    for (const row of rows) {
      const r = cleanRow(row);
      const productId = parseInt(r.product_id ?? r.Product_id, 10);
      const stock = parseInt(r.stock ?? r.Stock, 10);
      if (!productId || isNaN(stock) || stock < 0) { rejected++; continue; }
      toUpsert.push({ productId, stock });
    }
    await transaction(async (conn) => {
      for (const { productId, stock } of toUpsert) {
        await conn.execute(
          'INSERT INTO Inventory (product_id, seller_id, stock) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stock = stock + ?, last_updated = CURRENT_TIMESTAMP',
          [productId, sellerId, stock, stock]
        );
        processed++;
      }
    });
    res.json({
      success: true,
      summary: { processed, rejected, total: rows.length },
      preview: toUpsert.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, summary: { processed, rejected } });
  }
}

export async function ingestProducts(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  let processed = 0; let rejected = 0;
  try {
    const rows = parseCsv(req.file.buffer);
    const categoryNames = new Set();
    const toInsert = [];
    for (const row of rows) {
      const r = cleanRow(row);
      const name = r.name || r.Name || r.product_name;
      const categoryName = (r.category || r.Category || r.category_name || '').trim() || 'General';
      const price = parseFloat(r.price ?? r.Price ?? 0);
      if (!name || isNaN(price) || price < 0) { rejected++; continue; }
      categoryNames.add(categoryName);
      toInsert.push({
        name,
        categoryName,
        price,
        expiry_date: r.expiry_date || r.expiry || null,
      });
    }
    await transaction(async (conn) => {
      const catIds = {};
      for (const cname of categoryNames) {
        const [ex] = await conn.execute('SELECT id FROM Categories WHERE name = ?', [cname]);
        let id = ex?.[0]?.id;
        if (!id) {
          const [ins] = await conn.execute('INSERT INTO Categories (name) VALUES (?)', [cname]);
          id = ins.insertId;
        }
        catIds[cname] = id;
      }
      for (const r of toInsert) {
        await conn.execute(
          'INSERT INTO Products (name, category_id, price, expiry_date) VALUES (?, ?, ?, ?)',
          [r.name, catIds[r.categoryName], r.price, r.expiry_date]
        );
        processed++;
      }
    });
    res.json({
      success: true,
      summary: { processed, rejected, total: rows.length },
      preview: toInsert.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, summary: { processed, rejected } });
  }
}

export async function ingestSales(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  let processed = 0; let rejected = 0;
  const sellerId = req.user.id;
  try {
    const rows = parseCsv(req.file.buffer);
    const orders = new Map();
    for (const row of rows) {
      const r = cleanRow(row);
      const customerId = parseInt(r.customer_id ?? r.customer_Id, 10);
      const productId = parseInt(r.product_id ?? r.Product_id, 10);
      const quantity = parseInt(r.quantity ?? r.Quantity, 10);
      const price = parseFloat(r.price ?? r.Price);
      const orderRef = r.order_id ?? r.Order_id ?? `${customerId}-${Date.now()}-${Math.random()}`;
      if (!customerId || !productId || !quantity || quantity < 1) { rejected++; continue; }
      if (!orders.has(orderRef)) orders.set(orderRef, { customerId, items: [] });
      orders.get(orderRef).items.push({ productId, quantity, price: isNaN(price) ? null : price });
    }
    await transaction(async (conn) => {
      for (const { customerId, items } of orders.values()) {
        let total = 0;
        const withPrice = [];
        for (const it of items) {
          const [p] = await conn.execute('SELECT price FROM Products WHERE id = ?', [it.productId]);
          const unitPrice = it.price != null && !isNaN(it.price) ? it.price : Number(p?.[0]?.price ?? 0);
          total += unitPrice * it.quantity;
          withPrice.push({ ...it, price: unitPrice });
        }
        const [ord] = await conn.execute('INSERT INTO Orders (customer_id, total_amount) VALUES (?, ?)', [customerId, total]);
        const orderId = ord.insertId;
        for (const it of withPrice) {
          await conn.execute(
            'INSERT INTO Order_Items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
            [orderId, it.productId, sellerId, it.quantity, it.price]
          );
          await conn.execute(
            'UPDATE Inventory SET stock = stock - ? WHERE product_id = ? AND seller_id = ?',
            [it.quantity, it.productId, sellerId]
          );
        }
        processed++;
      }
    });
    res.json({
      success: true,
      summary: { processed: orders.size, rejected, total: rows.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, summary: { processed, rejected } });
  }
}

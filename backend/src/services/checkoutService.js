import { transaction } from '../config/db.js';

export async function placeOrder(conn, { customerId, items, sellerId }) {
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const [inv] = await conn.execute(
      'SELECT stock FROM Inventory WHERE product_id = ? AND seller_id = ? FOR UPDATE',
      [item.productId, sellerId]
    );
    const row = inv?.[0];
    if (!row || row.stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
    const [prod] = await conn.execute('SELECT price FROM Products WHERE id = ?', [item.productId]);
    const price = Number(prod?.[0]?.price ?? 0);
    const lineTotal = price * item.quantity;
    totalAmount += lineTotal;
    orderItems.push({ productId: item.productId, quantity: item.quantity, price });
  }

  const [orderResult] = await conn.execute(
    'INSERT INTO Orders (customer_id, total_amount) VALUES (?, ?)',
    [customerId, totalAmount]
  );
  const orderId = orderResult.insertId;

  for (const oi of orderItems) {
    await conn.execute(
      'INSERT INTO Order_Items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [orderId, oi.productId, sellerId, oi.quantity, oi.price]
    );
    await conn.execute(
      'UPDATE Inventory SET stock = stock - ? WHERE product_id = ? AND seller_id = ?',
      [oi.quantity, oi.productId, sellerId]
    );
  }

  return { orderId, totalAmount };
}

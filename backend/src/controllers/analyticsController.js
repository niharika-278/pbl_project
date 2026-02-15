import pool from '../config/db.js';

const LOW_STOCK_THRESHOLD = 10;

export async function getDashboard(req, res) {
  try {
    const [totalRevenue] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) AS value FROM Orders'
    );
    const [totalOrders] = await pool.execute('SELECT COUNT(*) AS value FROM Orders');
    const [activeCustomers] = await pool.execute('SELECT COUNT(DISTINCT customer_id) AS value FROM Orders');
    const [lowStock] = await pool.execute(
      `SELECT COUNT(*) AS value FROM Inventory WHERE stock > 0 AND stock < ?`,
      [LOW_STOCK_THRESHOLD]
    );
    const [expiredOrNear] = await pool.execute(
      `SELECT COUNT(DISTINCT p.id) AS value FROM Products p
       LEFT JOIN Inventory i ON i.product_id = p.id
       WHERE p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND (i.stock IS NULL OR i.stock > 0)`
    );

    const kpis = {
      totalRevenue: Number(totalRevenue?.[0]?.value ?? 0),
      totalOrders: Number(totalOrders?.[0]?.value ?? 0),
      activeCustomers: Number(activeCustomers?.[0]?.value ?? 0),
      lowStockItems: Number(lowStock?.[0]?.value ?? 0),
      expiredOrNearExpiry: Number(expiredOrNear?.[0]?.value ?? 0),
    };

    const [categories] = await pool.execute(
      `SELECT c.name, COALESCE(SUM(oi.quantity * oi.price), 0) AS total
       FROM Categories c
       LEFT JOIN Products p ON p.category_id = c.id
       LEFT JOIN Order_Items oi ON oi.product_id = p.id
       GROUP BY c.id, c.name
       ORDER BY total DESC`
    );

    const [salesByDay] = await pool.execute(
      `SELECT DATE(o.created_at) AS date, SUM(o.total_amount) AS amount, COUNT(o.id) AS orders
       FROM Orders o
       WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date`
    );

    const [revenueTrend] = await pool.execute(
      `SELECT DATE(o.created_at) AS date, SUM(o.total_amount) AS revenue
       FROM Orders o
       WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date`
    );

    res.json({
      success: true,
      data: {
        kpis,
        popularCategories: categories || [],
        salesByDay: salesByDay || [],
        revenueTrend: revenueTrend || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

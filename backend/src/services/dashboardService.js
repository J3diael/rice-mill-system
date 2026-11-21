import pool from "../config/db.js";

// "Today" and daily grouping use Philippine time
const TZ = "Asia/Manila";

export async function getDashboard() {
  const [counts, salesToday, salesByDay, milling, recentTransactions, lowStock] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM raw_materials) AS total_materials,
        (SELECT COUNT(*) FROM raw_materials WHERE quantity <= reorder_level) AS low_stock_materials,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM products WHERE stock <= reorder_level) AS low_stock_products
    `),
    pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE (created_at AT TIME ZONE $1)::date = (NOW() AT TIME ZONE $1)::date`,
      [TZ]
    ),
    pool.query(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(SUM(s.total), 0) AS total
       FROM generate_series(
              (NOW() AT TIME ZONE $1)::date - 6,
              (NOW() AT TIME ZONE $1)::date,
              interval '1 day'
            ) AS d(day)
       LEFT JOIN sales s ON (s.created_at AT TIME ZONE $1)::date = d.day::date
       GROUP BY d.day ORDER BY d.day`,
      [TZ]
    ),
    pool.query(
      `SELECT COUNT(*) AS batches, COALESCE(SUM(input_qty), 0) AS input_qty,
              ROUND(AVG(recovery_rate), 2) AS avg_recovery_rate
       FROM milling_batches
       WHERE date_trunc('month', milled_at AT TIME ZONE $1) = date_trunc('month', NOW() AT TIME ZONE $1)`,
      [TZ]
    ),
    pool.query(`
      SELECT it.*, rm.name AS material_name, rm.unit
      FROM inventory_transactions it JOIN raw_materials rm ON rm.id = it.material_id
      ORDER BY it.created_at DESC, it.id DESC LIMIT 5
    `),
    pool.query(`
      SELECT 'material' AS kind, name, quantity AS stock, unit, reorder_level
        FROM raw_materials WHERE quantity <= reorder_level
      UNION ALL
      SELECT 'product', name, stock, unit, reorder_level
        FROM products WHERE stock <= reorder_level
      ORDER BY name
    `),
  ]);

  return {
    ...counts.rows[0],
    sales_today: salesToday.rows[0],
    sales_last_7_days: salesByDay.rows,
    milling_this_month: milling.rows[0],
    recent_transactions: recentTransactions.rows,
    low_stock: lowStock.rows,
  };
}

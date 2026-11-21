import pool, { withTransaction } from "../config/db.js";
import {
  badRequest,
  notFound,
  optionalText,
  requireId,
  requireNumber,
  requireOneOf,
} from "../utils/validate.js";

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Point-of-sale checkout. Prices always come from the database (never from
 * the browser), stock is checked and reduced, and everything is saved
 * together or not at all.
 */
export async function createSale(
  { customer_name, payment_method = "CASH", amount_paid, items } = {},
  userId
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest("Add at least one item to the sale");
  }
  const method = requireOneOf(payment_method, ["CASH", "GCASH", "CREDIT"], "Payment method");

  // Merge repeated products into one line
  const quantities = new Map();
  for (const item of items) {
    const productId = requireId(item?.product_id, "Product");
    const quantity = requireNumber(item?.quantity, "Quantity");
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return withTransaction(async (client) => {
    const ids = [...quantities.keys()].sort((a, b) => a - b); // stable lock order
    const { rows: products } = await client.query(
      "SELECT * FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE",
      [ids]
    );
    if (products.length !== ids.length) throw notFound("One of the products no longer exists");

    const lines = products.map((product) => {
      const quantity = quantities.get(product.id);
      if (quantity > product.stock) {
        throw badRequest(
          `Not enough ${product.name} in stock (have ${product.stock} ${product.unit})`
        );
      }
      return {
        product,
        quantity,
        unit_price: product.price,
        subtotal: round2(quantity * product.price),
      };
    });

    const total = round2(lines.reduce((sum, line) => sum + line.subtotal, 0));

    let paid;
    if (method === "CREDIT") {
      paid = amount_paid === undefined || amount_paid === "" ? 0 : requireNumber(amount_paid, "Amount paid", { allowZero: true });
    } else {
      paid = amount_paid === undefined || amount_paid === "" ? total : requireNumber(amount_paid, "Amount paid", { allowZero: true });
      if (paid < total) throw badRequest(`Amount paid is less than the total of ₱${total.toFixed(2)}`);
    }
    paid = round2(paid);

    const saleResult = await client.query(
      `INSERT INTO sales (customer_name, payment_method, total, amount_paid, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [optionalText(customer_name), method, total, paid, userId]
    );
    const sale = saleResult.rows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, line.product.id, line.quantity, line.unit_price, line.subtotal]
      );
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [
        line.quantity,
        line.product.id,
      ]);
    }

    return getSale(sale.id, client);
  });
}

export async function getSale(id, client = pool) {
  const saleId = requireId(id, "Sale");
  const { rows } = await client.query(
    `SELECT s.*, u.name AS cashier_name
     FROM sales s LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [saleId]
  );
  if (!rows[0]) throw notFound("Sale not found");

  const items = await client.query(
    `SELECT si.*, p.name AS product_name, p.unit
     FROM sale_items si JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = $1 ORDER BY si.id`,
    [saleId]
  );

  const sale = rows[0];
  return {
    ...sale,
    change: sale.payment_method === "CREDIT" ? 0 : round2(sale.amount_paid - sale.total),
    balance: sale.payment_method === "CREDIT" ? round2(sale.total - sale.amount_paid) : 0,
    items: items.rows,
  };
}

export async function listSales({ limit = 50 } = {}) {
  const { rows } = await pool.query(
    `SELECT s.*, u.name AS cashier_name,
            (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
     FROM sales s LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT $1`,
    [Math.min(Number(limit) || 50, 500)]
  );
  return rows;
}

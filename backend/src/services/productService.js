import pool from "../config/db.js";
import { notFound, requireId, requireNumber, requireText } from "../utils/validate.js";

const optionalWeight = (value) =>
  value === undefined || value === null || value === "" ? null : requireNumber(value, "Weight (kg)");

const withStatus = (product) => ({
  ...product,
  stock_status: product.stock <= product.reorder_level ? "LOW_STOCK" : "OK",
});

export async function listProducts() {
  const { rows } = await pool.query("SELECT * FROM products ORDER BY name");
  return rows.map(withStatus);
}

export async function createProduct({ name, unit, weight_kg, price, stock = 0, reorder_level = 0 } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, unit, weight_kg, price, stock, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      requireText(name, "Name"),
      requireText(unit, "Unit"),
      optionalWeight(weight_kg),
      requireNumber(price, "Price", { allowZero: true }),
      requireNumber(stock, "Stock", { allowZero: true }),
      requireNumber(reorder_level, "Reorder level", { allowZero: true }),
    ]
  );
  return withStatus(rows[0]);
}

// Stock is not edited here on purpose: it only changes through milling and sales,
// so the numbers always match the records.
export async function updateProduct(id, { name, unit, weight_kg, price, reorder_level } = {}) {
  const { rows } = await pool.query(
    `UPDATE products SET name = $1, unit = $2, weight_kg = $3, price = $4, reorder_level = $5
     WHERE id = $6 RETURNING *`,
    [
      requireText(name, "Name"),
      requireText(unit, "Unit"),
      optionalWeight(weight_kg),
      requireNumber(price, "Price", { allowZero: true }),
      requireNumber(reorder_level, "Reorder level", { allowZero: true }),
      requireId(id, "Product"),
    ]
  );
  if (!rows[0]) throw notFound("Product not found");
  return withStatus(rows[0]);
}

import pool, { withTransaction } from "../config/db.js";
import {
  badRequest,
  notFound,
  optionalText,
  requireId,
  requireNumber,
  requireOneOf,
  requireText,
} from "../utils/validate.js";

const withStatus = (material) => ({
  ...material,
  stock_status: material.quantity <= material.reorder_level ? "LOW_STOCK" : "OK",
});

export async function listMaterials() {
  const { rows } = await pool.query("SELECT * FROM raw_materials ORDER BY name");
  return rows.map(withStatus);
}

export async function createMaterial({ name, quantity = 0, unit, reorder_level = 0 } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO raw_materials (name, quantity, unit, reorder_level)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      requireText(name, "Name"),
      requireNumber(quantity, "Quantity", { allowZero: true }),
      requireText(unit, "Unit"),
      requireNumber(reorder_level, "Reorder level", { allowZero: true }),
    ]
  );
  return withStatus(rows[0]);
}

export async function updateMaterial(id, { name, unit, reorder_level } = {}) {
  const { rows } = await pool.query(
    `UPDATE raw_materials SET name = $1, unit = $2, reorder_level = $3
     WHERE id = $4 RETURNING *`,
    [
      requireText(name, "Name"),
      requireText(unit, "Unit"),
      requireNumber(reorder_level, "Reorder level", { allowZero: true }),
      requireId(id, "Material"),
    ]
  );
  if (!rows[0]) throw notFound("Material not found");
  return withStatus(rows[0]);
}

/**
 * Change a material's stock and log the movement.
 * Must be called inside a transaction; locks the material row so two
 * people recording stock at the same time can't overwrite each other.
 */
export async function moveStock(client, { materialId, type, quantity, note, userId }) {
  const { rows } = await client.query(
    "SELECT * FROM raw_materials WHERE id = $1 FOR UPDATE",
    [materialId]
  );
  const material = rows[0];
  if (!material) throw notFound("Material not found");

  const change = type === "ADD" ? quantity : -quantity;
  const newQuantity = material.quantity + change;
  if (newQuantity < 0) {
    throw badRequest(
      `Not enough ${material.name} in stock (have ${material.quantity} ${material.unit}, need ${quantity})`
    );
  }

  const updated = await client.query(
    "UPDATE raw_materials SET quantity = $1 WHERE id = $2 RETURNING *",
    [newQuantity, materialId]
  );
  const transaction = await client.query(
    `INSERT INTO inventory_transactions (material_id, type, quantity, note, user_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [materialId, type, quantity, note, userId]
  );

  return { material: withStatus(updated.rows[0]), transaction: transaction.rows[0] };
}

export async function recordTransaction({ material_id, type, quantity, note } = {}, userId) {
  const input = {
    materialId: requireId(material_id, "Material"),
    type: requireOneOf(type, ["ADD", "USE"], "Type"),
    quantity: requireNumber(quantity, "Quantity"),
    note: optionalText(note),
    userId,
  };
  return withTransaction((client) => moveStock(client, input));
}

export async function listTransactions({ limit = 50 } = {}) {
  const { rows } = await pool.query(
    `SELECT it.*, rm.name AS material_name, rm.unit, u.name AS user_name
     FROM inventory_transactions it
     JOIN raw_materials rm ON rm.id = it.material_id
     LEFT JOIN users u ON u.id = it.user_id
     ORDER BY it.created_at DESC, it.id DESC
     LIMIT $1`,
    [Math.min(Number(limit) || 50, 500)]
  );
  return rows;
}

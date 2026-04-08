import pool from "../config/db.js";

export const createTransaction = async (material_id, type, quantity) => {
  const result = await pool.query(
    `INSERT INTO inventory_transactions (material_id, type, quantity)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [material_id, type, quantity]
  );

  return result.rows[0];
};

export const getAllTransactions = async () => {
  const result = await pool.query(`
    SELECT it.*, rm.name AS material_name
    FROM inventory_transactions it
    JOIN raw_materials rm ON it.material_id = rm.id
    ORDER BY it.created_at DESC
  `);

  return result.rows;
};
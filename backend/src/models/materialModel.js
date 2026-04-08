import pool from "../config/db.js";

export const getAllMaterials = async () => {
  const result = await pool.query("SELECT * FROM raw_materials ORDER BY id ASC");
  return result.rows;
};

export const createMaterial = async (name, quantity, unit, reorderLevel) => {
  const result = await pool.query(
    `INSERT INTO raw_materials (name, quantity, unit, reorder_level)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, quantity, unit, reorderLevel]
  );

  return result.rows[0];
};

export const updateMaterialQuantity = async (id, newQuantity) => {
  const result = await pool.query(
    `UPDATE raw_materials
     SET quantity = $1
     WHERE id = $2
     RETURNING *`,
    [newQuantity, id]
  );

  return result.rows[0];
};
import pool, { withTransaction } from "../config/db.js";
import { notFound, optionalText, requireId, requireNumber } from "../utils/validate.js";
import { moveStock } from "./inventoryService.js";

/**
 * Record a milling run. In one transaction:
 *  1. takes the raw material (e.g. palay) out of inventory,
 *  2. adds the milled product to finished-goods stock,
 *  3. saves the batch with its recovery rate.
 */
export async function createBatch({ material_id, input_qty, product_id, output_qty, notes } = {}, userId) {
  const materialId = requireId(material_id, "Raw material");
  const productId = requireId(product_id, "Product");
  const inputQty = requireNumber(input_qty, "Input quantity");
  const outputQty = requireNumber(output_qty, "Output quantity");
  const cleanNotes = optionalText(notes);

  return withTransaction(async (client) => {
    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) throw notFound("Product not found");

    const { material } = await moveStock(client, {
      materialId,
      type: "USE",
      quantity: inputQty,
      note: `Milling: ${outputQty} ${product.unit} of ${product.name}`,
      userId,
    });

    // Recovery rate only makes sense when we can compare kilograms to kilograms
    let recoveryRate = null;
    if (material.unit.toLowerCase() === "kg" && product.weight_kg) {
      recoveryRate = Math.round(((outputQty * product.weight_kg) / inputQty) * 10000) / 100;
    }

    await client.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [outputQty, productId]);

    const { rows } = await client.query(
      `INSERT INTO milling_batches
         (material_id, input_qty, product_id, output_qty, recovery_rate, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [materialId, inputQty, productId, outputQty, recoveryRate, cleanNotes, userId]
    );

    return { ...rows[0], material_name: material.name, product_name: product.name };
  });
}

export async function listBatches({ limit = 50 } = {}) {
  const { rows } = await pool.query(
    `SELECT mb.*, rm.name AS material_name, rm.unit AS material_unit,
            p.name AS product_name, p.unit AS product_unit, u.name AS user_name
     FROM milling_batches mb
     JOIN raw_materials rm ON rm.id = mb.material_id
     JOIN products p ON p.id = mb.product_id
     LEFT JOIN users u ON u.id = mb.user_id
     ORDER BY mb.milled_at DESC, mb.id DESC
     LIMIT $1`,
    [Math.min(Number(limit) || 50, 500)]
  );
  return rows;
}

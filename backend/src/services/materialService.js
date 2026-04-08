import { getAllMaterials, createMaterial } from "../models/materialModel.js";

export const fetchMaterials = async () => {
  const materials = await getAllMaterials();

  const processed = materials.map((material) => {
    const quantity = Number(material.quantity);
    const reorderLevel = Number(material.reorder_level);

    const stock_status =
      quantity <= reorderLevel ? "LOW_STOCK" : "OK";

    return {
      ...material,
      stock_status,
    };
  });

  return processed;
};

export const addMaterial = async (data) => {
  const { name, quantity, unit, reorder_level } = data;

  return await createMaterial(name, quantity, unit, reorder_level);
};
import { fetchMaterials } from "../services/materialService.js";

export const getMaterials = async (req, res) => {
  try {
    const materials = await fetchMaterials();
    res.json(materials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

import { addMaterial } from "../services/materialService.js";

export const createMaterialController = async (req, res) => {
  try {
    const material = await addMaterial(req.body);
    res.status(201).json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create material" });
  }
};
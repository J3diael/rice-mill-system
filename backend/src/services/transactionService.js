import { createTransaction, getAllTransactions } from "../models/transactionModel.js";
import { getAllMaterials, updateMaterialQuantity } from "../models/materialModel.js";

export const processTransaction = async (data) => {
  const { material_id, type, quantity } = data;

  // get current material
  const materials = await getAllMaterials();
  const material = materials.find(m => m.id === material_id);

  if (!material) {
    throw new Error("Material not found");
  }

  let newQuantity;

  if (type === "ADD") {
    newQuantity = Number(material.quantity) + Number(quantity);
  } else if (type === "USE") {
    newQuantity = Number(material.quantity) - Number(quantity);
  } else {
    throw new Error("Invalid transaction type");
  }

  if (newQuantity < 0) {
    throw new Error("Insufficient stock");
  }

  // update material stock
  const updatedMaterial = await updateMaterialQuantity(material_id, newQuantity);

  // log transaction
  const transaction = await createTransaction(material_id, type, quantity);

  return {
    transaction,
    updatedMaterial
  };
};

export const fetchTransactions = async () => {
  return await getAllTransactions();
};
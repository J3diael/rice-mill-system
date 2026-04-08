import { getAllMaterials } from "../models/materialModel.js";
import { getAllTransactions } from "../models/transactionModel.js";

export const getDashboardData = async () => {
  const materials = await getAllMaterials();
  const transactions = await getAllTransactions();

  const totalMaterials = materials.length;

  const lowStockItems = materials.filter(
    (m) => Number(m.quantity) <= Number(m.reorder_level)
  ).length;

  const totalTransactions = transactions.length;

  const recentTransactions = transactions.slice(0, 5); // latest 5

  return {
    totalMaterials,
    lowStockItems,
    totalTransactions,
    recentTransactions,
  };
};
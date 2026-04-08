import { processTransaction, fetchTransactions } from "../services/TransactionService.js";

export const createTransactionController = async (req, res) => {
  try {
    console.log(req.body);
    const result = await processTransaction(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const getTransactionsController = async (req, res) => {
  try {
    const transactions = await fetchTransactions();
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
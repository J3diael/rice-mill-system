import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as auth from "../services/authService.js";
import * as inventory from "../services/inventoryService.js";
import * as products from "../services/productService.js";
import * as milling from "../services/millingService.js";
import * as sales from "../services/salesService.js";
import { getDashboard } from "../services/dashboardService.js";

const router = Router();

// ---------- Public ----------
router.get("/health", (req, res) => res.json({ status: "ok" }));
router.post("/auth/login", async (req, res) => res.json(await auth.login(req.body)));

// ---------- Everything below needs a logged-in user ----------
router.use(requireAuth);

router.get("/auth/me", (req, res) => res.json(req.user));

router.get("/dashboard", async (req, res) => res.json(await getDashboard()));

// Raw materials & stock movements
router.get("/materials", async (req, res) => res.json(await inventory.listMaterials()));
router.post("/materials", requireRole("admin"), async (req, res) =>
  res.status(201).json(await inventory.createMaterial(req.body))
);
router.put("/materials/:id", requireRole("admin"), async (req, res) =>
  res.json(await inventory.updateMaterial(req.params.id, req.body))
);
router.get("/transactions", async (req, res) => res.json(await inventory.listTransactions(req.query)));
router.post("/transactions", async (req, res) =>
  res.status(201).json(await inventory.recordTransaction(req.body, req.user.id))
);

// Finished products
router.get("/products", async (req, res) => res.json(await products.listProducts()));
router.post("/products", requireRole("admin"), async (req, res) =>
  res.status(201).json(await products.createProduct(req.body))
);
router.put("/products/:id", requireRole("admin"), async (req, res) =>
  res.json(await products.updateProduct(req.params.id, req.body))
);

// Milling
router.get("/milling", async (req, res) => res.json(await milling.listBatches(req.query)));
router.post("/milling", async (req, res) =>
  res.status(201).json(await milling.createBatch(req.body, req.user.id))
);

// Sales / POS
router.get("/sales", async (req, res) => res.json(await sales.listSales(req.query)));
router.get("/sales/:id", async (req, res) => res.json(await sales.getSale(req.params.id)));
router.post("/sales", async (req, res) =>
  res.status(201).json(await sales.createSale(req.body, req.user.id))
);

// User management (admin only)
router.get("/users", requireRole("admin"), async (req, res) => res.json(await auth.listUsers()));
router.post("/users", requireRole("admin"), async (req, res) =>
  res.status(201).json(await auth.createUser(req.body))
);

export default router;

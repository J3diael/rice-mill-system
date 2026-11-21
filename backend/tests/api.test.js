// Integration tests: run against a real, EMPTY test database.
//   DATABASE_URL=postgres://postgres:pass@localhost:5432/rice_mill_test npm test
// The tests drop and recreate all tables in that database.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import request from "supertest";

process.env.JWT_SECRET ||= "test-secret";
if (!process.env.DATABASE_URL?.includes("test")) {
  throw new Error("Refusing to run: DATABASE_URL must point to a database with 'test' in its name");
}

const { default: app } = await import("../src/app.js");
const { default: pool } = await import("../src/config/db.js");

let adminToken;
let staffToken;
const api = () => request(app);

before(async () => {
  await pool.query(`DROP TABLE IF EXISTS sale_items, sales, milling_batches, products,
    inventory_transactions, raw_materials, users CASCADE`);
  await pool.query(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  await pool.query(await readFile(new URL("../db/seed.sql", import.meta.url), "utf8"));
  const hash = await bcrypt.hash("admin-pass-123", 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@test.local', $1, 'admin')",
    [hash]
  );
});

after(() => pool.end());

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const productByName = async (name) =>
  (await pool.query("SELECT * FROM products WHERE name = $1", [name])).rows[0];
const materialByName = async (name) =>
  (await pool.query("SELECT * FROM raw_materials WHERE name = $1", [name])).rows[0];

test("rejects wrong password and protects routes", async () => {
  const bad = await api().post("/api/auth/login").send({ email: "admin@test.local", password: "nope" });
  assert.equal(bad.status, 401);

  const noToken = await api().get("/api/materials");
  assert.equal(noToken.status, 401);
});

test("admin logs in and creates a staff account", async () => {
  const res = await api().post("/api/auth/login").send({ email: "ADMIN@test.local", password: "admin-pass-123" });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, "admin");
  assert.equal(res.body.user.password_hash, undefined);
  adminToken = res.body.token;

  const created = await api()
    .post("/api/users")
    .set(auth(adminToken))
    .send({ name: "Cashier", email: "cashier@test.local", password: "cashier-pass", role: "staff" });
  assert.equal(created.status, 201);

  const login = await api().post("/api/auth/login").send({ email: "cashier@test.local", password: "cashier-pass" });
  staffToken = login.body.token;
  assert.ok(staffToken);
});

test("staff cannot use admin-only routes", async () => {
  const res = await api()
    .post("/api/products")
    .set(auth(staffToken))
    .send({ name: "X", unit: "sack", price: 1 });
  assert.equal(res.status, 403);
});

test("stock in/out works with string ids and blocks negative stock", async () => {
  const palay = await materialByName("Palay (unmilled rice)");

  const add = await api()
    .post("/api/transactions")
    .set(auth(staffToken))
    .send({ material_id: String(palay.id), type: "ADD", quantity: "500" });
  assert.equal(add.status, 201);
  assert.equal(add.body.material.quantity, palay.quantity + 500);

  const tooMuch = await api()
    .post("/api/transactions")
    .set(auth(staffToken))
    .send({ material_id: palay.id, type: "USE", quantity: 999999 });
  assert.equal(tooMuch.status, 400);
  assert.match(tooMuch.body.error, /Not enough/);

  // the failed request must not have changed anything
  assert.equal((await materialByName("Palay (unmilled rice)")).quantity, palay.quantity + 500);
});

test("milling uses palay, adds product stock and computes recovery rate", async () => {
  const palay = await materialByName("Palay (unmilled rice)");
  const rice = await productByName("Regular milled rice (25 kg)");

  const res = await api()
    .post("/api/milling")
    .set(auth(staffToken))
    .send({ material_id: palay.id, input_qty: 1000, product_id: rice.id, output_qty: 26 });
  assert.equal(res.status, 201);
  assert.equal(res.body.recovery_rate, 65); // 26 sacks × 25 kg / 1000 kg

  assert.equal((await materialByName("Palay (unmilled rice)")).quantity, palay.quantity - 1000);
  assert.equal((await productByName("Regular milled rice (25 kg)")).stock, rice.stock + 26);
});

test("POS sale uses database prices, reduces stock and returns change", async () => {
  const rice = await productByName("Regular milled rice (25 kg)");
  const bran = await productByName("Rice bran / darak (50 kg)");

  const res = await api()
    .post("/api/sales")
    .set(auth(staffToken))
    .send({
      customer_name: "Aling Nena",
      payment_method: "CASH",
      amount_paid: 5000,
      items: [
        { product_id: rice.id, quantity: 2, unit_price: 1 }, // unit_price from client is ignored
        { product_id: bran.id, quantity: 1 },
        { product_id: rice.id, quantity: 1 },
      ],
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.total, 3 * rice.price + bran.price);
  assert.equal(res.body.change, 5000 - res.body.total);
  assert.equal(res.body.items.length, 2);

  assert.equal((await productByName("Regular milled rice (25 kg)")).stock, rice.stock - 3);

  const receipt = await api().get(`/api/sales/${res.body.id}`).set(auth(staffToken));
  assert.equal(receipt.body.customer_name, "Aling Nena");
});

test("POS rejects overselling and underpayment without saving anything", async () => {
  const rice = await productByName("Premium milled rice (25 kg)");
  const before = (await pool.query("SELECT COUNT(*) FROM sales")).rows[0].count;

  const oversell = await api()
    .post("/api/sales")
    .set(auth(staffToken))
    .send({ items: [{ product_id: rice.id, quantity: rice.stock + 1 }] });
  assert.equal(oversell.status, 400);

  const underpaid = await api()
    .post("/api/sales")
    .set(auth(staffToken))
    .send({ amount_paid: 1, items: [{ product_id: rice.id, quantity: 1 }] });
  assert.equal(underpaid.status, 400);

  const after = (await pool.query("SELECT COUNT(*) FROM sales")).rows[0].count;
  assert.equal(after, before);
  assert.equal((await productByName("Premium milled rice (25 kg)")).stock, rice.stock);
});

test("credit sale records the unpaid balance", async () => {
  const rice = await productByName("Premium milled rice (25 kg)");
  const res = await api()
    .post("/api/sales")
    .set(auth(staffToken))
    .send({ payment_method: "CREDIT", amount_paid: 500, items: [{ product_id: rice.id, quantity: 1 }] });
  assert.equal(res.status, 201);
  assert.equal(res.body.balance, rice.price - 500);
});

test("dashboard summarises today's sales and stock", async () => {
  const res = await api().get("/api/dashboard").set(auth(staffToken));
  assert.equal(res.status, 200);
  assert.equal(res.body.sales_today.count, 2);
  assert.equal(res.body.sales_last_7_days.length, 7);
  assert.equal(res.body.milling_this_month.batches, 1);
  assert.ok(Array.isArray(res.body.low_stock));
});

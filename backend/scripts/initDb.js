// Creates the tables, loads sample data, and creates the first admin account.
// Usage: npm run db:init            (schema + sample data + admin)
//        npm run db:init -- --no-seed (schema + admin only)

import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const read = (file) => readFile(new URL(`../db/${file}`, import.meta.url), "utf8");

async function main() {
  await pool.query(await read("schema.sql"));
  console.log("✔ Tables ready");

  if (!process.argv.includes("--no-seed")) {
    await pool.query(await read("seed.sql"));
    console.log("✔ Sample materials and products loaded");
  }

  const { ADMIN_NAME = "Administrator", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("ℹ ADMIN_EMAIL / ADMIN_PASSWORD not set in .env, so no admin account was created");
  } else if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  } else {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const { rowCount } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING`,
      [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), hash]
    );
    console.log(rowCount ? `✔ Admin account created: ${ADMIN_EMAIL}` : `ℹ Admin ${ADMIN_EMAIL} already exists`);
  }
}

main()
  .catch((err) => {
    console.error("✖ Database setup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

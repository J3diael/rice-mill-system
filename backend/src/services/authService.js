import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError, requireText, requireOneOf } from "../utils/validate.js";

const publicUser = ({ id, name, email, role, created_at }) => ({ id, name, email, role, created_at });

export async function login({ email, password } = {}) {
  const cleanEmail = requireText(email, "Email").toLowerCase();
  requireText(password, "Password");

  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [cleanEmail]);
  const user = rows[0];

  // Same message whether the email or the password is wrong
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Incorrect email or password");
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return { token, user: publicUser(user) };
}

export async function listUsers() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id");
  return rows.map(publicUser);
}

export async function createUser({ name, email, password, role = "staff" } = {}) {
  const cleanName = requireText(name, "Name");
  const cleanEmail = requireText(email, "Email").toLowerCase();
  const cleanPassword = requireText(password, "Password");
  if (cleanPassword.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  requireOneOf(role, ["admin", "staff"], "Role");

  const hash = await bcrypt.hash(cleanPassword, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [cleanName, cleanEmail, hash, role]
  );
  return publicUser(rows[0]);
}

import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "rice_mill_db",
  password: "J3diael",
  port: 5432,
});

export default pool;
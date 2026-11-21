import pg from "pg";
import { env } from "./env.js";

// Return NUMERIC columns as JS numbers instead of strings
pg.types.setTypeParser(1700, (value) => parseFloat(value));
// Return COUNT(*) (bigint) as a number
pg.types.setTypeParser(20, (value) => parseInt(value, 10));

const pool = new pg.Pool({ connectionString: env.databaseUrl });

/**
 * Run several queries as one all-or-nothing database transaction.
 * If anything throws, every change inside `work` is rolled back.
 */
export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default pool;

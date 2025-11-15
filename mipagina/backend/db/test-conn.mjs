import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: false,
});

try {
  const r = await pool.query(
    "SELECT current_database() AS db, current_user AS usr, inet_server_addr() AS host, inet_server_port() AS port;"
  );
  console.log("OK:", r.rows[0]);
} catch (e) {
  console.error("TEST ERROR:", e.code, e.message);
} finally {
  process.exit(0);
}

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { createHash } from "crypto";
import { readFileSync } from "fs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// If the schema already exists (e.g. created by a prior Prisma setup), the
// initial Drizzle migration will fail trying to CREATE TYPE enums that are
// already there. Detect this and pre-register the migration as applied so
// drizzle-orm skips the SQL and only runs any future migrations.
const { rows } = await pool.query(`
  SELECT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'AccountCategory'
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) AS exists
`);

if (rows[0].exists) {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const sql = readFileSync("./drizzle/0000_uneven_wind_dancer.sql", "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");

  const { rows: existing } = await pool.query(
    "SELECT id FROM drizzle.__drizzle_migrations WHERE hash = $1",
    [hash]
  );

  if (existing.length === 0) {
    const journal = JSON.parse(readFileSync("./drizzle/meta/_journal.json", "utf8"));
    await pool.query(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [hash, journal.entries[0].when]
    );
    console.log("Existing schema detected — initial migration marked as applied.");
  }
}

const db = drizzle(pool);
await migrate(db, { migrationsFolder: "./drizzle" });
await pool.end();

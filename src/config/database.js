import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

let db;
let sql;

if (isProduction) {
  // Production → Neon cloud → HTTP driver
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');

  sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql);
} else {
  // Development (Docker) → TCP Postgres → node-postgres driver
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const pg = await import('pg');

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool);
}

export { db };

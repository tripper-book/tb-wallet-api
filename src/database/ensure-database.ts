/**
 * Ensures the application database exists. For MySQL: connects to the server
 * and runs CREATE DATABASE IF NOT EXISTS. On hosted MySQL the database often
 * already exists; this is a no-op in that case.
 *
 * Used at app startup (when SKIP_DB is not true) and by: npm run db:create
 */
import * as mysql from 'mysql2/promise';

export async function ensureDatabase(dbName?: string): Promise<void> {
  const name = dbName ?? process.env.DB_NAME ?? 'tb_wallet';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Invalid DB_NAME: ${name}`);
  }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  });
  try {
    await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
    console.log(`Database "${name}" is ready.`);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  require('dotenv/config');
  ensureDatabase().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

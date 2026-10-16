// lib/db.ts
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'J41pens123',
  database: process.env.DB_NAME || 'e_checksheet_ga',
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
  allowExitOnIdle: true, // Allow pool to exit on idle (prevents hanging during next build)
};

// Singleton pattern for Next.js to prevent multiple pools during hot-reloads and worker builds
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const pool = globalThis.pgPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalThis.pgPool = pool;
}

// Error listener for idle PostgreSQL clients (avoid hard process.exit(-1) in web server)
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
});

export default pool;
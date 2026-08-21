// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'J41pens123',
  database: process.env.DB_NAME || 'e_checksheet_ga',
  max: 10, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  allowExitOnIdle: false, // Don't allow pool to exit on idle
});

// Optional: Event listeners for monitoring
pool.on('connect', () => {
  console.log('✅ PostgreSQL database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection on startup
pool.connect()
  .then(() => {
    console.log('🚀 PostgreSQL pool ready');
  })
  .catch((err) => {
    console.error('💥 PostgreSQL connection error:', err.message);
  });

export default pool;
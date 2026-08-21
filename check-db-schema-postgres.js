const { Pool } = require('pg');

async function checkSchema() {
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'e_checksheet_ga',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Check if table exists
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'toilet_inspections'
      );
    `;
    const tableResult = await pool.query(tableQuery);
    const tableExists = tableResult.rows[0];

    if (!tableExists || !tableExists.exists) {
      console.log('Table toilet_inspections does not exist');
      await pool.end();
      return;
    }

    // Get table structure
    const columnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'toilet_inspections'
      ORDER BY ordinal_position;
    `;
    const columns = await pool.query(columnQuery);

    console.log('Table structure:');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`${col.column_name}: ${col.data_type} ${nullable} ${defaultVal}`.trim());
    });

    // Check if there are any records
    const countQuery = 'SELECT COUNT(*) as total FROM toilet_inspections';
    const countResult = await pool.query(countQuery);
    console.log(`\nTotal records: ${countResult.rows[0].total}`);

    if (countResult.rows[0].total > 0) {
      // Show a sample record
      const sampleQuery = 'SELECT * FROM toilet_inspections LIMIT 1';
      const sampleResult = await pool.query(sampleQuery);
      console.log('\nSample record:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();

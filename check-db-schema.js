const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'e_checksheet_ga',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'toilet_inspections'");
    if (tables.length === 0) {
      console.log('Table toilet_inspections does not exist');
      return;
    }

    // Get table structure
    const [columns] = await pool.query("DESCRIBE toilet_inspections");
    console.log('Table structure:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check if there are any records
    const [count] = await pool.query("SELECT COUNT(*) as total FROM toilet_inspections");
    console.log(`\nTotal records: ${count[0].total}`);

    if (count[0].total > 0) {
      // Show a sample record
      const [sample] = await pool.query("SELECT * FROM toilet_inspections LIMIT 1");
      console.log('\nSample record:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();

const mysql = require('mysql2/promise');

async function checkTables() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'e_checksheet_ga'
  });

  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log('- ' + Object.values(table)[0]);
    });

    // Check lift_barang tables
    const [liftTables] = await pool.query('SHOW TABLES LIKE "lift_barang%"');
    console.log('\nLift barang tables:');
    liftTables.forEach(table => {
      console.log('- ' + Object.values(table)[0]);
    });

    // Check structure of lift_barang_inspections if exists
    if (liftTables.length > 0) {
      const [structure] = await pool.query('DESCRIBE lift_barang_inspections');
      console.log('\nStructure of lift_barang_inspections:');
      structure.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
      });

      const [structure2] = await pool.query('DESCRIBE lift_barang_inspection_items');
      console.log('\nStructure of lift_barang_inspection_items:');
      structure2.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTables();

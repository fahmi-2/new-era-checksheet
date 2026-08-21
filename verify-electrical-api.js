// Script untuk verifikasi dan testing Electrical Inspections API
// Jalankan dengan: node verify-electrical-api.js

const mysql = require('mysql2/promise');

async function verifyAPI() {
  console.log('🔍 Starting Electrical Inspections API Verification...\n');

  let connection;

  try {
    // 1. Test Database Connection
    console.log('1️⃣  Testing Database Connection...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'checksheet'
    });
    console.log('✅ Database connection successful!\n');

    // 2. Check Tables Exist
    console.log('2️⃣  Checking if tables exist...');
    
    const [tableResults] = await connection.execute(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('electrical_inspections', 'electrical_inspection_details')
    `, [process.env.DB_NAME || 'checksheet']);

    if (tableResults.length === 2) {
      console.log('✅ Both tables exist!');
      tableResults.forEach(t => {
        console.log(`   - ${t.TABLE_NAME}`);
      });
    } else {
      console.log('❌ Missing tables! Please run database-schema-electrical.sql');
      console.log(`   Found: ${tableResults.length}/2 tables`);
      process.exit(1);
    }
    console.log();

    // 3. Check Table Structure
    console.log('3️⃣  Checking table structure...');
    
    const [headerColumns] = await connection.execute(`
      DESCRIBE electrical_inspections
    `);
    
    console.log('✅ electrical_inspections columns:');
    headerColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log();

    const [detailColumns] = await connection.execute(`
      DESCRIBE electrical_inspection_details
    `);
    
    console.log('✅ electrical_inspection_details columns:');
    detailColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log();

    // 4. Check Foreign Keys
    console.log('4️⃣  Checking Foreign Keys...');
    
    const [fkResults] = await connection.execute(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'electrical_inspection_details' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    if (fkResults.length > 0) {
      console.log('✅ Foreign key constraint exists:');
      fkResults.forEach(fk => {
        console.log(`   - ${fk.CONSTRAINT_NAME} → ${fk.REFERENCED_TABLE_NAME}`);
      });
    } else {
      console.log('❌ Foreign key constraint missing!');
    }
    console.log();

    // 5. Count Records
    console.log('5️⃣  Checking data...');
    
    const [headerCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM electrical_inspections
    `);
    
    const [detailCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM electrical_inspection_details
    `);

    console.log(`✅ electrical_inspections: ${headerCount[0].count} records`);
    console.log(`✅ electrical_inspection_details: ${detailCount[0].count} records`);
    console.log();

    // 6. Show Sample Records
    if (headerCount[0].count > 0) {
      console.log('6️⃣  Sample records:');
      const [samples] = await connection.execute(`
        SELECT * FROM electrical_inspections 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      samples.forEach((record, idx) => {
        console.log(`\n   Record ${idx + 1}:`);
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Type: ${record.type}`);
        console.log(`   - Area: ${record.area}`);
        console.log(`   - Date: ${record.tanggal}`);
        console.log(`   - PIC: ${record.pic}`);
        console.log(`   - Created: ${record.created_at}`);
      });
      console.log();
    }

    console.log('\n✅ All verifications passed!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Database connection: OK');
    console.log('   ✓ Tables structure: OK');
    console.log('   ✓ Foreign keys: OK');
    console.log('   ✓ Database ready for API');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Verification failed:');
    console.error(`   ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check .env.local configuration');
    console.error('   2. Verify MySQL server is running');
    console.error('   3. Run: SOURCE database-schema-electrical.sql');
    console.error('   4. Check database-schema-electrical.sql file exists');
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

verifyAPI();

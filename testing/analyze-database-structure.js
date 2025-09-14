const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function analyzeDatabaseStructure() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Get all tables in the database
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`📋 Total Tables: ${tables.length}`);
    console.log('');

    // Analyze each table
    for (const table of tables) {
      console.log(`🔍 Table: ${table.TABLE_NAME}`);
      console.log(`  - Rows: ${table.TABLE_ROWS || 0}`);
      console.log(`  - Data Size: ${Math.round((table.DATA_LENGTH || 0) / 1024)} KB`);
      console.log(`  - Index Size: ${Math.round((table.INDEX_LENGTH || 0) / 1024)} KB`);

      // Get table structure
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [dbConfig.database, table.TABLE_NAME]);

      console.log(`  - Columns: ${columns.length}`);
      columns.forEach(col => {
        const key = col.COLUMN_KEY ? ` (${col.COLUMN_KEY})` : '';
        console.log(`    * ${col.COLUMN_NAME}: ${col.DATA_TYPE}${key}`);
      });

      // Get foreign key relationships
      const [foreignKeys] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [dbConfig.database, table.TABLE_NAME]);

      if (foreignKeys.length > 0) {
        console.log(`  - Foreign Keys: ${foreignKeys.length}`);
        foreignKeys.forEach(fk => {
          console.log(`    * ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
      }

      // Sample data for key tables
      if (table.TABLE_NAME === 'products' || table.TABLE_NAME === 'stock_movements') {
        const [sampleData] = await connection.execute(`
          SELECT * FROM ${table.TABLE_NAME} LIMIT 3
        `);
        console.log(`  - Sample Data: ${sampleData.length} rows`);
        if (sampleData.length > 0) {
          console.log(`    * First row keys: ${Object.keys(sampleData[0]).join(', ')}`);
        }
      }

      console.log('');
    }

    // Check for potential issues
    console.log('🚨 POTENTIAL ISSUES ANALYSIS:');
    console.log('');

    // Check for duplicate table names (case insensitive)
    const tableNames = tables.map(t => t.TABLE_NAME.toLowerCase());
    const duplicates = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      console.log('❌ Duplicate table names detected (case insensitive):', [...new Set(duplicates)]);
    }

    // Check for unused tables (no foreign key references)
    const referencedTables = new Set();
    for (const table of tables) {
      const [refs] = await connection.execute(`
        SELECT REFERENCED_TABLE_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = ?
      `, [dbConfig.database, table.TABLE_NAME]);
      
      if (refs.length > 0) {
        referencedTables.add(table.TABLE_NAME);
      }
    }

    const unusedTables = tables.filter(t => !referencedTables.has(t.TABLE_NAME) && t.TABLE_NAME !== 'users');
    if (unusedTables.length > 0) {
      console.log('⚠️  Potentially unused tables (no foreign key references):');
      unusedTables.forEach(t => console.log(`    - ${t.TABLE_NAME}`));
    }

    // Check for orphaned records
    console.log('');
    console.log('🔍 Checking for orphaned records...');
    
    // Check orphaned stock movements
    const [orphanedMovements] = await connection.execute(`
      SELECT COUNT(*) as count FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE p.id IS NULL
    `);
    if (orphanedMovements[0].count > 0) {
      console.log(`❌ Found ${orphanedMovements[0].count} orphaned stock movements`);
    }

    // Check orphaned transaction items
    const [orphanedItems] = await connection.execute(`
      SELECT COUNT(*) as count FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE p.id IS NULL
    `);
    if (orphanedItems[0].count > 0) {
      console.log(`❌ Found ${orphanedItems[0].count} orphaned transaction items`);
    }

    // Check orphaned product requests
    const [orphanedRequests] = await connection.execute(`
      SELECT COUNT(*) as count FROM product_requests pr
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.product_id IS NOT NULL AND p.id IS NULL
    `);
    if (orphanedRequests[0].count > 0) {
      console.log(`❌ Found ${orphanedRequests[0].count} orphaned product requests`);
    }

    console.log('');
    console.log('✅ Database analysis completed!');

  } catch (err) {
    console.error('❌ Error analyzing database:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

analyzeDatabaseStructure();

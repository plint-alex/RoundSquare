import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

console.log('=== Verification Report ===\n');

// 1. Check .env file
console.log('1. Checking .env file...');
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  const hasDatabaseUrl = envContent.includes('DATABASE_URL=postgresql://postgres:*******@localhost:5432/the_last_of_guss');
  console.log('   ✓ .env file exists');
  console.log('   ' + (hasDatabaseUrl ? '✓' : '✗') + ' DATABASE_URL configured correctly');
} else {
  console.log('   ✗ .env file NOT FOUND');
}

// 2. Check pg package
console.log('\n2. Checking pg package...');
try {
  require.resolve('pg');
  console.log('   ✓ pg package installed');
} catch (e) {
  console.log('   ✗ pg package NOT installed');
}

// 3. Check database connection and existence
console.log('\n3. Checking database...');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '*******',
  database: 'postgres', // Connect to default DB first
});

try {
  await client.connect();
  console.log('   ✓ Connected to PostgreSQL');

  // Check if database exists
  const dbCheck = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'the_last_of_guss'"
  );
  
  if (dbCheck.rows.length > 0) {
    console.log('   ✓ Database "the_last_of_guss" exists');
    
    // Connect to the actual database to check tables
    await client.end();
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '*******',
      database: 'the_last_of_guss',
    });
    
    await dbClient.connect();
    console.log('   ✓ Connected to "the_last_of_guss" database');
    
    // Check tables
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'rounds', 'round_participants', '_prisma_migrations'];
    const existingTables = tablesResult.rows.map(r => r.table_name);
    
    console.log('\n4. Checking database tables...');
    console.log('   Found tables:', existingTables.join(', '));
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log('   ✓ Table "' + table + '" exists');
      } else if (table !== '_prisma_migrations') {
        console.log('   ✗ Table "' + table + '" NOT FOUND');
      }
    }
    
    await dbClient.end();
  } else {
    console.log('   ✗ Database "the_last_of_guss" does NOT exist');
  }
  
} catch (error) {
  console.log('   ✗ Error:', error.message);
} finally {
  try {
    await client.end();
  } catch (e) {
    // Already closed
  }
}

console.log('\n=== Verification Complete ===');


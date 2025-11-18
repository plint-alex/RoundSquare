import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '*******',
  database: 'postgres', // Connect to default database to create our database
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'the_last_of_guss'"
    );

    if (checkResult.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query('CREATE DATABASE the_last_of_guss');
      console.log('Database "the_last_of_guss" created successfully');
    } else {
      console.log('Database "the_last_of_guss" already exists');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();


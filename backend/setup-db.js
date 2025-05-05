const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a new pool with the database connection details
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    // Create the database if it doesn't exist
    await client.query(`CREATE DATABASE fleet_manager`);
    console.log('Created database: fleet_manager');
  } catch (err) {
    console.log('Database already exists, continuing with setup...');
  } finally {
    client.release();
  }

  // Connect to the fleet_manager database
  const fleetManagerPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'fleet_manager',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Read the schema file
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Read the service history schema file
    const serviceHistorySchemaSQL = fs.readFileSync(path.join(__dirname, 'service-history-schema.sql'), 'utf8');
    
    // Drop existing tables to allow clean recreation
    await fleetManagerPool.query('DROP TABLE IF EXISTS service_history CASCADE');
    await fleetManagerPool.query('DROP VIEW IF EXISTS service_history_with_vehicles CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS reminders CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS vehicles CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS user_sessions CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS notifications CASCADE');
    await fleetManagerPool.query('DROP TABLE IF EXISTS users CASCADE');
    
    // Execute the schema
    await fleetManagerPool.query(schemaSQL);
    
    // Execute the service history schema
    await fleetManagerPool.query(serviceHistorySchemaSQL);
    
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await fleetManagerPool.end();
    await pool.end();
  }
}

setupDatabase();
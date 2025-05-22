const express = require('express');
const router = express.Router();
const db = require('../db');
const { createAuditLog } = require('../audit-logger');

// Helper function to generate random dates within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random numbers within a range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate sample vehicles with different statuses
router.post('/generate-vehicles', async (req, res) => {
  try {
    // Log the action in audit log
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'Debug',
      page: 'Vehicles',
      field: 'debug_generate_vehicles',
      new_value: 'Generated sample vehicles',
      user_agent: req.headers['user-agent']
    });

    // Vehicle types and makes for random generation
    const types = ['Vieglais auto', 'Kravas auto', 'Piekabe', 'Autobuss', 'Motocikls'];
    const makes = [
      { make: 'Toyota', models: ['Corolla', 'RAV4', 'Camry', 'Hilux', 'Land Cruiser'] },
      { make: 'Volkswagen', models: ['Golf', 'Passat', 'Tiguan', 'Polo', 'Transporter'] },
      { make: 'Mercedes', models: ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'Sprinter'] },
      { make: 'BMW', models: ['3 Series', '5 Series', 'X5', 'X3', 'i8'] },
      { make: 'Ford', models: ['Focus', 'Fiesta', 'Mondeo', 'Transit', 'F-150'] }
    ];
    const statuses = ['Active', 'Maintenance', 'Inactive'];
    const documentStatuses = ['Valid', 'Expiring Soon', 'Expired'];
    
    // Begin transaction
    await db.query('BEGIN');

    const generatedVehicles = [];
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    // Generate 5 sample vehicles
    for (let i = 0; i < 5; i++) {
      // Generate a random license plate
      const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
      const numbers = '0123456789';
      
      let registrationNumber = '';
      for (let j = 0; j < 2; j++) {
        registrationNumber += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      registrationNumber += '-';
      for (let j = 0; j < 3; j++) {
        registrationNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      
      // Generate random vehicle data
      const randomMakeIndex = Math.floor(Math.random() * makes.length);
      const make = makes[randomMakeIndex].make;
      const model = makes[randomMakeIndex].models[Math.floor(Math.random() * makes[randomMakeIndex].models.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const year = Math.floor(Math.random() * 10) + 2016; // Years between 2016-2025
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const documents = documentStatuses[Math.floor(Math.random() * documentStatuses.length)];
      const mileage = `${randomInt(5000, 200000)} km`;
      const lastService = randomDate(oneYearAgo, now).toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      const regaplnr = `AF ${randomInt(1000000, 9999999)}`;

      // Check if vehicle already exists
      const existingCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [registrationNumber]);
      if (existingCheck.rows.length > 0) {
        // Skip if already exists
        continue;
      }

      // Insert vehicle
      const vehicleResult = await db.query(
        'INSERT INTO vehicles (id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [registrationNumber, status, type, lastService, documents, make, model, year, registrationNumber, regaplnr, mileage]
      );
      
      const vehicle = vehicleResult.rows[0];
      
      // Generate reminders for the vehicle
      const reminders = [];
      
      // Insurance reminder - sometime in the next 3-12 months
      const insuranceDate = new Date();
      insuranceDate.setMonth(insuranceDate.getMonth() + randomInt(3, 12));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Insurance Renewal', insuranceDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Insurance Renewal',
        date: insuranceDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Service due - sometime in the next 1-6 months
      const serviceDate = new Date();
      serviceDate.setMonth(serviceDate.getMonth() + randomInt(1, 6));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Service Due', serviceDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Service Due',
        date: serviceDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Road worthiness - sometime in the next 1-24 months
      const roadWorthinessDate = new Date();
      roadWorthinessDate.setMonth(roadWorthinessDate.getMonth() + randomInt(1, 24));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Road Worthiness Certificate', roadWorthinessDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Road Worthiness Certificate',
        date: roadWorthinessDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Add reminders to the vehicle object
      vehicle.reminders = reminders;
      generatedVehicles.push(vehicle);
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: `Generated ${generatedVehicles.length} sample vehicles`,
      vehicles: generatedVehicles
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error generating sample vehicles:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Generate service history records for existing vehicles
router.post('/generate-service-history', async (req, res) => {
  try {
    // Log the action in audit log
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'Debug',
      page: 'Service History',
      field: 'debug_generate_service_history',
      new_value: 'Generated sample service history',
      user_agent: req.headers['user-agent']
    });

    // Fetch all vehicles
    const vehiclesResult = await db.query('SELECT * FROM vehicles');
    const vehicles = vehiclesResult.rows;
    
    if (vehicles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No vehicles found. Please add vehicles first.' 
      });
    }

    // Service types for random generation
    const serviceTypes = [
      'Oil Change',
      'Tire Rotation',
      'Brake Inspection',
      'Engine Tune-up',
      'Air Filter Replacement',
      'Battery Replacement',
      'Transmission Service',
      'Coolant Flush',
      'Wheel Alignment',
      'Spark Plugs Replacement'
    ];
    
    const locations = [
      'Main City Service Center',
      'East Side Garage',
      'West Workshop',
      'Central Mechanics',
      'North Fleet Services'
    ];
    
    const technicians = [
      'John Smith',
      'Maria Rodriguez',
      'Alex Johnson',
      'Thomas Lee',
      'Sarah Patel'
    ];
    
    // Begin transaction
    await db.query('BEGIN');

    const generatedRecords = [];
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    
    // Generate 20 service records distributed among the vehicles
    for (let i = 0; i < 20; i++) {
      // Select a random vehicle
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      
      // Parse current mileage - Add null check to prevent errors
      let currentMileage = 0;
      if (vehicle.mileage) {
        currentMileage = parseInt(vehicle.mileage.replace(/\D/g, ''));
      }
      if (isNaN(currentMileage) || currentMileage === 0) {
        currentMileage = randomInt(10000, 100000);
      }
      
      // Generate random service data
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const serviceDate = randomDate(twoYearsAgo, now);
      
      // Service mileage should be less than or equal to current mileage
      const mileage = randomInt(Math.max(1000, currentMileage - 50000), currentMileage);
      
      // Random cost between 50 and 2000
      const cost = (Math.round((Math.random() * 1950 + 50) * 100) / 100).toFixed(2);
      
      const technician = technicians[Math.floor(Math.random() * technicians.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Random notes
      const notes = `Routine ${serviceType.toLowerCase()} performed. Vehicle in ${['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)]} condition.`;
      
      // Insert service record
      const recordResult = await db.query(
        `INSERT INTO service_history 
         (vehicle_id, service_type, service_date, mileage, cost, technician, location, notes, created_by, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [vehicle.id, serviceType, serviceDate, mileage, cost, technician, location, notes, req.user.id, new Date()]
      );
      
      generatedRecords.push(recordResult.rows[0]);
      
      // Update vehicle's last service date if this service is more recent
      const formattedDate = serviceDate.toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      
      // Use a simpler approach to update the lastService field
      await db.query(
        `UPDATE vehicles SET lastService = $1 WHERE id = $2`,
        [formattedDate, vehicle.id]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: `Generated ${generatedRecords.length} service history records`,
      records: generatedRecords
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error generating service history:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Generate vehicles with expired reminders (for testing notifications)
router.post('/generate-expired-reminders', async (req, res) => {
  try {
    // Log the action
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'Debug',
      page: 'Vehicles',
      field: 'debug_generate_expired_reminders',
      new_value: 'Generated vehicles with expired reminders',
      user_agent: req.headers['user-agent']
    });

    // Vehicle types and makes for random generation
    const types = ['Vieglais auto', 'Kravas auto', 'Autobuss'];
    const makes = [
      { make: 'Toyota', models: ['Corolla', 'RAV4', 'Hilux'] },
      { make: 'Volkswagen', models: ['Golf', 'Passat', 'Transporter'] },
      { make: 'Mercedes', models: ['A-Class', 'Sprinter', 'Vito'] }
    ];
    
    // Begin transaction
    await db.query('BEGIN');

    const generatedVehicles = [];
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    // Generate 3 vehicles with expired reminders
    for (let i = 0; i < 3; i++) {
      // Generate a random license plate
      const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
      const numbers = '0123456789';
      
      let registrationNumber = '';
      for (let j = 0; j < 2; j++) {
        registrationNumber += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      registrationNumber += '-';
      for (let j = 0; j < 3; j++) {
        registrationNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      
      // Check if vehicle already exists
      const existingCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [registrationNumber]);
      if (existingCheck.rows.length > 0) {
        // Skip if already exists
        continue;
      }
      
      // Generate random vehicle data
      const randomMakeIndex = Math.floor(Math.random() * makes.length);
      const make = makes[randomMakeIndex].make;
      const model = makes[randomMakeIndex].models[Math.floor(Math.random() * makes[randomMakeIndex].models.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const year = Math.floor(Math.random() * 10) + 2016; // Years between 2016-2025
      const mileage = `${randomInt(5000, 200000)} km`;
      const lastService = oneMonthAgo.toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      const regaplnr = `AF ${randomInt(1000000, 9999999)}`;

      // Insert vehicle
      const vehicleResult = await db.query(
        'INSERT INTO vehicles (id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [registrationNumber, 'Active', type, lastService, 'Expired', make, model, year, registrationNumber, regaplnr, mileage]
      );
      
      const vehicle = vehicleResult.rows[0];
      
      // Generate expired reminders for the vehicle
      const reminders = [];
      
      // Expired insurance reminder - 1-3 months in the past
      const insuranceDate = new Date();
      insuranceDate.setMonth(insuranceDate.getMonth() - randomInt(1, 3));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Insurance Renewal', insuranceDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Insurance Renewal',
        date: insuranceDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Expired service reminder - 1-2 months in the past
      const serviceDate = new Date();
      serviceDate.setMonth(serviceDate.getMonth() - randomInt(1, 2));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Service Due', serviceDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Service Due',
        date: serviceDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Add reminders to the vehicle object
      vehicle.reminders = reminders;
      generatedVehicles.push(vehicle);
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: `Generated ${generatedVehicles.length} vehicles with expired reminders`,
      vehicles: generatedVehicles
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error generating vehicles with expired reminders:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Generate vehicles with upcoming reminders (for testing notifications)
router.post('/generate-upcoming-reminders', async (req, res) => {
  try {
    // Log the action
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'Debug',
      page: 'Vehicles',
      field: 'debug_generate_upcoming_reminders',
      new_value: 'Generated vehicles with upcoming reminders',
      user_agent: req.headers['user-agent']
    });

    // Vehicle types and makes for random generation
    const types = ['Vieglais auto', 'Kravas auto', 'Autobuss'];
    const makes = [
      { make: 'Toyota', models: ['Land Cruiser', 'Tundra', 'Prius'] },
      { make: 'Volkswagen', models: ['Tiguan', 'Arteon', 'ID.4'] },
      { make: 'Mercedes', models: ['G-Class', 'E-Class', 'GLE'] }
    ];
    
    // Begin transaction
    await db.query('BEGIN');

    const generatedVehicles = [];
    const now = new Date();
    
    // Generate 3 vehicles with upcoming reminders
    for (let i = 0; i < 3; i++) {
      // Generate a random license plate
      const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
      const numbers = '0123456789';
      
      let registrationNumber = '';
      for (let j = 0; j < 2; j++) {
        registrationNumber += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      registrationNumber += '-';
      for (let j = 0; j < 3; j++) {
        registrationNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      
      // Check if vehicle already exists
      const existingCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [registrationNumber]);
      if (existingCheck.rows.length > 0) {
        // Skip if already exists
        continue;
      }
      
      // Generate random vehicle data
      const randomMakeIndex = Math.floor(Math.random() * makes.length);
      const make = makes[randomMakeIndex].make;
      const model = makes[randomMakeIndex].models[Math.floor(Math.random() * makes[randomMakeIndex].models.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const year = Math.floor(Math.random() * 10) + 2016; // Years between 2016-2025
      const mileage = `${randomInt(5000, 200000)} km`;
      const lastService = new Date().toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      const regaplnr = `AF ${randomInt(1000000, 9999999)}`;

      // Insert vehicle
      const vehicleResult = await db.query(
        'INSERT INTO vehicles (id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [registrationNumber, 'Active', type, lastService, 'Expiring Soon', make, model, year, registrationNumber, regaplnr, mileage]
      );
      
      const vehicle = vehicleResult.rows[0];
      
      // Generate upcoming reminders for the vehicle
      const reminders = [];
      
      // Upcoming insurance reminder - 5-15 days in the future
      const insuranceDate = new Date();
      insuranceDate.setDate(insuranceDate.getDate() + randomInt(5, 15));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Insurance Renewal', insuranceDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Insurance Renewal',
        date: insuranceDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Upcoming road worthiness - 10-20 days in the future
      const roadWorthinessDate = new Date();
      roadWorthinessDate.setDate(roadWorthinessDate.getDate() + randomInt(10, 20));
      await db.query(
        'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
        [registrationNumber, 'Road Worthiness Certificate', roadWorthinessDate.toISOString().split('T')[0], true]
      );
      reminders.push({
        name: 'Road Worthiness Certificate',
        date: roadWorthinessDate.toISOString().split('T')[0],
        enabled: true
      });
      
      // Add reminders to the vehicle object
      vehicle.reminders = reminders;
      generatedVehicles.push(vehicle);
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: `Generated ${generatedVehicles.length} vehicles with upcoming reminders`,
      vehicles: generatedVehicles
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error generating vehicles with upcoming reminders:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
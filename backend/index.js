const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Fleet Management System Backend');
});

// Vehicle API Routes
// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicles');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single vehicle by ID
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const { id, status, type, lastService, documents, make, model, year, license, vin, mileage } = req.body;
    
    const result = await db.query(
      'INSERT INTO vehicles (id, status, type, "lastService", documents, make, model, year, license, vin, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, status, type, lastService, documents, make, model, year, license, vin, mileage]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a vehicle
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type, lastService, documents, make, model, year, license, vin, mileage } = req.body;
    
    const result = await db.query(
      'UPDATE vehicles SET status = $1, type = $2, "lastService" = $3, documents = $4, make = $5, model = $6, year = $7, license = $8, vin = $9, mileage = $10 WHERE id = $11 RETURNING *',
      [status, type, lastService, documents, make, model, year, license, vin, mileage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
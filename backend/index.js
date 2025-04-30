const express = require('express');
const cors = require('cors');
const db = require('./db');
// Import routes
const integrationsRoutes = require('./routes/integrations');
const { router: authRoutes, authenticateToken } = require('./routes/auth');
// Import the enhanced notification service functions
const { 
  generateNotifications, 
  getNotifications, 
  markNotificationAsRead, 
  dismissNotification,
  markAllNotificationsAsRead
} = require('./generate-notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Fleet Management System Backend');
});

// Register the authentication routes
app.use('/api/auth', authRoutes);

// Register the integrations routes
app.use('/api/integrations', integrationsRoutes);

// Vehicle API Routes
// Get all vehicles
app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const vehiclesResult = await db.query('SELECT * FROM vehicles');
    
    // Get all reminders
    const remindersResult = await db.query('SELECT * FROM reminders ORDER BY vehicle_id, date');
    
    // Group reminders by vehicle_id
    const remindersByVehicle = {};
    for (const reminder of remindersResult.rows) {
      if (!remindersByVehicle[reminder.vehicle_id]) {
        remindersByVehicle[reminder.vehicle_id] = [];
      }
      remindersByVehicle[reminder.vehicle_id].push(reminder);
    }
    
    // Add reminders to each vehicle
    const vehicles = vehiclesResult.rows.map(vehicle => {
      return {
        ...vehicle,
        reminders: remindersByVehicle[vehicle.id] || []
      };
    });
    
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single vehicle by ID
app.get('/api/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicleResult = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Get vehicle reminders
    const remindersResult = await db.query(
      'SELECT * FROM reminders WHERE vehicle_id = $1 ORDER BY date ASC',
      [id]
    );
    
    // Combine vehicle with its reminders
    const vehicle = vehicleResult.rows[0];
    vehicle.reminders = remindersResult.rows;
    
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new vehicle
app.post('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const { id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage, reminders } = req.body;
    
    // Check if a vehicle with this ID already exists
    const existingVehicle = await db.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (existingVehicle.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Vehicle with this registration number already exists',
        code: 'DUPLICATE_VEHICLE'
      });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Insert vehicle
      const vehicleResult = await db.query(
        'INSERT INTO vehicles (id, status, type, "lastService", documents, make, model, year, license, regaplnr, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage]
      );
      
      // Process reminders if provided
      if (reminders && Array.isArray(reminders)) {
        for (const reminder of reminders) {
          if (!reminder.name || !reminder.date) {
            continue; // Skip invalid reminders
          }
          
          await db.query(
            'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
            [id, reminder.name, reminder.date, reminder.enabled !== undefined ? reminder.enabled : true]
          );
        }
      }
      
      // Fetch created vehicle with reminders
      const createdVehicleResult = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
      const remindersResult = await db.query('SELECT * FROM reminders WHERE vehicle_id = $1 ORDER BY date ASC', [id]);
      
      // Combine vehicle with reminders
      const createdVehicle = createdVehicleResult.rows[0];
      createdVehicle.reminders = remindersResult.rows;
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.status(201).json(createdVehicle);
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a vehicle
app.put('/api/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type, lastService, documents, make, model, year, license, regaplnr, mileage, reminders } = req.body;
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Update vehicle
      const vehicleResult = await db.query(
        'UPDATE vehicles SET status = $1, type = $2, "lastService" = $3, documents = $4, make = $5, model = $6, year = $7, license = $8, regaplnr = $9, mileage = $10 WHERE id = $11 RETURNING *',
        [status, type, lastService, documents, make, model, year, license, regaplnr, mileage, id]
      );
      
      if (vehicleResult.rows.length === 0) {
        throw new Error('Vehicle not found');
      }
      
      // Process reminders if provided
      if (reminders && Array.isArray(reminders)) {
        // First, delete all existing reminders for this vehicle
        await db.query('DELETE FROM reminders WHERE vehicle_id = $1', [id]);
        
        // Insert new reminders
        for (const reminder of reminders) {
          if (!reminder.name || !reminder.date) {
            continue; // Skip invalid reminders
          }
          
          await db.query(
            'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4)',
            [id, reminder.name, reminder.date, reminder.enabled !== undefined ? reminder.enabled : true]
          );
        }
      }
      
      // Fetch updated vehicle with reminders
      const updatedVehicleResult = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
      const remindersResult = await db.query('SELECT * FROM reminders WHERE vehicle_id = $1 ORDER BY date ASC', [id]);
      
      // Combine vehicle with reminders
      const updatedVehicle = updatedVehicleResult.rows[0];
      updatedVehicle.reminders = remindersResult.rows;
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.json(updatedVehicle);
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error(err);
    
    if (err.message === 'Vehicle not found') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
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

// Reminders API Routes
// Get all reminders for a vehicle
app.get('/api/vehicles/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const result = await db.query(
      'SELECT * FROM reminders WHERE vehicle_id = $1 ORDER BY date ASC',
      [id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new reminder
app.post('/api/vehicles/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, enabled } = req.body;
    
    // Validate input
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }
    
    // First check if vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const result = await db.query(
      'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, date, enabled !== undefined ? enabled : true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a reminder
app.put('/api/reminders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, enabled } = req.body;
    
    // Validate input
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }
    
    const result = await db.query(
      'UPDATE reminders SET name = $1, date = $2, enabled = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, date, enabled !== undefined ? enabled : true, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a reminder
app.delete('/api/reminders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM reminders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Batch update reminders for a vehicle
app.put('/api/vehicles/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reminders } = req.body;
    
    if (!Array.isArray(reminders)) {
      return res.status(400).json({ error: 'Reminders must be an array' });
    }
    
    // First check if vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Delete all existing reminders for this vehicle
      await db.query('DELETE FROM reminders WHERE vehicle_id = $1', [id]);
      
      // Insert new reminders
      const insertedReminders = [];
      for (const reminder of reminders) {
        if (!reminder.name || !reminder.date) {
          continue; // Skip invalid reminders
        }
        
        const result = await db.query(
          'INSERT INTO reminders (vehicle_id, name, date, enabled) VALUES ($1, $2, $3, $4) RETURNING *',
          [id, reminder.name, reminder.date, reminder.enabled !== undefined ? reminder.enabled : true]
        );
        
        insertedReminders.push(result.rows[0]);
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.json(insertedReminders);
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications API Routes
// Get all notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { unreadOnly, limit, offset } = req.query;
    
    // Use the enhanced notification service
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === 'true',
      activeOnly: true
    };
    
    const notifications = await getNotifications(options);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedNotification = await markNotificationAsRead(id);
    res.json(updatedNotification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as dismissed
app.put('/api/notifications/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedNotification = await dismissNotification(id);
    res.json(updatedNotification);
  } catch (err) {
    console.error('Error dismissing notification:', err);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const count = await markAllNotificationsAsRead();
    res.json({ 
      success: true,
      message: 'All notifications marked as read',
      count
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate notifications from reminders
app.post('/api/notifications/generate', authenticateToken, async (req, res) => {
  try {
    const { force } = req.query;
    
    // Use the enhanced notification generator
    const notifications = await generateNotifications(force === 'true');
    
    res.json({
      success: true,
      notificationsCreated: notifications.length,
      notifications
    });
  } catch (err) {
    console.error('Error generating notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Generate initial notifications when server starts
  try {
    console.log('Generating initial notifications from reminders...');
    const notifications = await generateNotifications();
    console.log(`Generated ${notifications.length} initial notifications.`);
  } catch (error) {
    console.error('Error generating initial notifications:', error);
  }
});
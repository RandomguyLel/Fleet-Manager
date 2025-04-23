const express = require('express');
const cors = require('cors');
const db = require('./db');
// Import integrations routes
const integrationsRoutes = require('./routes/integrations');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Fleet Management System Backend');
});

// Register the integrations routes
app.use('/api/integrations', integrationsRoutes);

// Vehicle API Routes
// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
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
app.get('/api/vehicles/:id', async (req, res) => {
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
app.post('/api/vehicles', async (req, res) => {
  try {
    const { id, status, type, lastService, documents, make, model, year, license, vin, mileage, reminders } = req.body;
    
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
        'INSERT INTO vehicles (id, status, type, "lastService", documents, make, model, year, license, vin, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [id, status, type, lastService, documents, make, model, year, license, vin, mileage]
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
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, type, lastService, documents, make, model, year, license, vin, mileage, reminders } = req.body;
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Update vehicle
      const vehicleResult = await db.query(
        'UPDATE vehicles SET status = $1, type = $2, "lastService" = $3, documents = $4, make = $5, model = $6, year = $7, license = $8, vin = $9, mileage = $10 WHERE id = $11 RETURNING *',
        [status, type, lastService, documents, make, model, year, license, vin, mileage, id]
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

// Reminders API Routes
// Get all reminders for a vehicle
app.get('/api/vehicles/:id/reminders', async (req, res) => {
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
app.post('/api/vehicles/:id/reminders', async (req, res) => {
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
app.put('/api/reminders/:id', async (req, res) => {
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
app.delete('/api/reminders/:id', async (req, res) => {
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
app.put('/api/vehicles/:id/reminders', async (req, res) => {
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
app.get('/api/notifications', async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    let query = `
      SELECT n.*, v.make, v.model 
      FROM notifications n
      LEFT JOIN vehicles v ON n.vehicle_id = v.id
    `;
    
    if (unreadOnly === 'true') {
      query += ` WHERE n.is_read = false AND n.is_dismissed = false`;
    } else {
      query += ` WHERE n.is_dismissed = false`;
    }
    
    query += ` ORDER BY n.created_at DESC`;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as dismissed
app.put('/api/notifications/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE notifications SET is_dismissed = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate notifications from reminders
app.post('/api/notifications/generate', async (req, res) => {
  try {
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Get all active reminders
      const remindersResult = await db.query(
        `SELECT r.*, v.make, v.model 
         FROM reminders r
         JOIN vehicles v ON r.vehicle_id = v.id
         WHERE r.enabled = TRUE`
      );
      
      const today = new Date();
      const notifications = [];
      
      // Process each reminder
      for (const reminder of remindersResult.rows) {
        const dueDate = new Date(reminder.date);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Get notification type based on reminder name
        let type = 'other';
        if (reminder.name.toLowerCase().includes('insurance')) type = 'insurance';
        else if (reminder.name.toLowerCase().includes('service')) type = 'maintenance';
        else if (reminder.name.toLowerCase().includes('worthiness')) type = 'roadworthiness';
        
        // Determine if we need to create a notification
        let shouldCreateNotification = false;
        let priority = 'normal';
        let title = '';
        
        if (diffDays <= 0) {
          // Overdue
          shouldCreateNotification = true;
          priority = 'high';
          title = `${reminder.name} overdue for ${reminder.make} ${reminder.model}`;
        } else if (diffDays <= 7) {
          // Due within a week
          shouldCreateNotification = true;
          priority = 'high';
          title = `${reminder.name} due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
        } else if (diffDays <= 30) {
          // Due within a month
          shouldCreateNotification = true;
          priority = 'normal';
          title = `${reminder.name} due soon`;
        }
        
        if (shouldCreateNotification) {
          // Check if a similar notification already exists
          const existingNotificationResult = await db.query(
            `SELECT id FROM notifications 
             WHERE vehicle_id = $1 AND type = $2 AND due_date = $3 AND is_dismissed = FALSE`,
            [reminder.vehicle_id, type, reminder.date]
          );
          
          if (existingNotificationResult.rows.length === 0) {
            const message = `${reminder.name} for ${reminder.make} ${reminder.model} (${reminder.vehicle_id}) is due on ${new Date(reminder.date).toLocaleDateString()}.`;
            
            // Create notification
            const notificationResult = await db.query(
              `INSERT INTO notifications (vehicle_id, type, title, message, due_date, priority)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
              [reminder.vehicle_id, type, title, message, reminder.date, priority]
            );
            
            notifications.push(notificationResult.rows[0]);
          }
        }
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.json({
        success: true,
        notificationsCreated: notifications.length,
        notifications
      });
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error generating notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
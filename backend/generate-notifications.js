const db = require('./db');


/**
 * Generate notifications from active reminders
 * @param {boolean} force - If true, will regenerate already existing notifications
 * @returns {Promise<Array>} Array of generated notifications
 */
async function generateNotifications(force = false) {
  try {
    console.log('Generating notifications from reminders...');
    
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
          title = `notifications.types.${type}.overdue`;
        } else if (diffDays <= 7) {
          // Due within a week
          shouldCreateNotification = true;
          priority = 'high';
          title = `notifications.types.${type}.dueInDays`;
        } else if (diffDays <= 30) {
          // Due within a month
          shouldCreateNotification = true;
          priority = 'normal';
          title = `notifications.types.${type}.dueSoon`;
        }
        
        if (shouldCreateNotification) {
          // Check if a similar notification already exists (unless force=true)
          let shouldCreateNew = true;
          if (!force) {
            const existingNotificationResult = await db.query(
              `SELECT id FROM notifications 
               WHERE vehicle_id = $1 AND type = $2 AND due_date = $3 AND is_dismissed = FALSE`,
              [reminder.vehicle_id, type, reminder.date]
            );
            shouldCreateNew = existingNotificationResult.rows.length === 0;
          }
          
          if (shouldCreateNew) {
            const messageVars = {
              reminderName: reminder.name,
              vehicle: `${reminder.make} ${reminder.model} (${reminder.vehicle_id})`,
              date: new Date(reminder.date).toLocaleDateString()
            };
            
            // Create notification
            const notificationResult = await db.query(
              `INSERT INTO notifications (vehicle_id, type, title, message_vars, due_date, priority, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
              [reminder.vehicle_id, type, title, JSON.stringify(messageVars), reminder.date, priority]
            );
            
            notifications.push(notificationResult.rows[0]);
          }
        }
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      console.log(`Successfully generated ${notifications.length} new notifications`);
      return notifications;
    } catch (err) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error generating notifications:', err);
    throw err;
  }
}

/**
 * Get notifications with pagination and filtering
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of notifications to return
 * @param {number} options.offset - Number of notifications to skip
 * @param {boolean} options.unreadOnly - If true, returns only unread notifications
 * @param {boolean} options.activeOnly - If true, returns only active (not dismissed) notifications
 * @returns {Promise<Array>} Array of notifications
 */
async function getNotifications(options = {}) {
  const {
    limit = 50,
    offset = 0,
    unreadOnly = false,
    activeOnly = true
  } = options;
  
  try {
    let query = `
      SELECT n.*, v.make, v.model, v.regaplnr 
      FROM notifications n
      JOIN vehicles v ON n.vehicle_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (unreadOnly) {
      query += ` AND n.is_read = FALSE`;
    }
    
    if (activeOnly) {
      query += ` AND n.is_dismissed = FALSE`;
    }
    
    query += ` ORDER BY n.created_at DESC, n.priority DESC`;
    
    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }
    
    if (offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    throw err;
  }
}

/**
 * Mark a notification as read
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function markNotificationAsRead(id) {
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    return result.rows[0];
  } catch (err) {
    console.error(`Error marking notification ${id} as read:`, err);
    throw err;
  }
}

/**
 * Mark a notification as dismissed
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function dismissNotification(id) {
  try {
    const result = await db.query(
      `UPDATE notifications SET is_dismissed = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    return result.rows[0];
  } catch (err) {
    console.error(`Error dismissing notification ${id}:`, err);
    throw err;
  }
}

/**
 * Mark all notifications as read
 * 
 * @returns {Promise<number>} Number of updated notifications
 */
async function markAllNotificationsAsRead() {
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE RETURNING id`
    );
    
    return result.rows.length;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    throw err;
  }
}

// Run the function if script is executed directly
if (require.main === module) {
  generateNotifications()
    .then(() => {
      console.log('Notifications generation completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Failed to generate notifications:', err);
      process.exit(1);
    });
}

module.exports = { 
  generateNotifications,
  getNotifications,
  markNotificationAsRead,
  dismissNotification,
  markAllNotificationsAsRead
};
// filepath: c:\Users\ritva\Desktop\TMS\Fleet Manager\backend\generate-notifications.js
const db = require('./db');

async function generateNotifications() {
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

module.exports = { generateNotifications };
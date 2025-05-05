const db = require('./db');
const { createAuditLog } = require('./audit-logger');

/**
 * Get service history records for all vehicles or a specific vehicle
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of service history records
 */
async function getServiceHistory(options = {}) {
  try {
    const { vehicleId, limit = 50, offset = 0, sort = 'service_date', order = 'DESC' } = options;
    
    let query = 'SELECT * FROM service_history_with_vehicles';
    const params = [];
    
    if (vehicleId) {
      query += ' WHERE vehicle_id = $1';
      params.push(vehicleId);
    }
    
    query += ` ORDER BY ${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting service history:', error);
    throw error;
  }
}

/**
 * Get a specific service history record by ID
 * @param {number} id - Service history record ID
 * @returns {Promise<Object>} Service history record
 */
async function getServiceHistoryById(id) {
  try {
    const result = await db.query('SELECT * FROM service_history_with_vehicles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Service history record not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error getting service history record ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new service history record
 * @param {Object} data - Service history data
 * @param {Object} user - User creating the record
 * @returns {Promise<Object>} Created service history record
 */
async function createServiceHistory(data, user) {
  try {
    const { 
      vehicle_id, service_type, service_date, mileage, cost,
      technician, location, notes, reminder_id, documents 
    } = data;
    
    // Validate required fields
    if (!vehicle_id || !service_type || !service_date) {
      throw new Error('Vehicle ID, service type, and service date are required');
    }
    
    // Validate vehicle exists
    const vehicleCheck = await db.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      throw new Error('Vehicle not found');
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Insert service history record
      const result = await db.query(
        `INSERT INTO service_history 
        (vehicle_id, service_type, service_date, mileage, cost, technician, location, notes, reminder_id, created_by, documents)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          vehicle_id, service_type, service_date, mileage, cost,
          technician, location, notes, reminder_id, user.id,
          documents ? JSON.stringify(documents) : null
        ]
      );
      
      // If this service was created from a reminder, mark the reminder as completed
      if (reminder_id) {
        await db.query('UPDATE reminders SET enabled = FALSE WHERE id = $1', [reminder_id]);
      }
      
      // Update vehicle's last service date and mileage
      await db.query(
        'UPDATE vehicles SET "lastService" = $1, mileage = $2 WHERE id = $3',
        [service_date, mileage ? mileage + ' km' : null, vehicle_id]
      );
      
      // Create audit log
      await createAuditLog({
        user_id: user.id,
        username: user.username,
        action: 'Create',
        page: 'Service History',
        field: 'service_record',
        new_value: JSON.stringify({
          id: result.rows[0].id,
          vehicle_id,
          service_type,
          service_date,
          mileage
        }),
        ip_address: user.ip,
        user_agent: user.userAgent
      });
      
      // Commit transaction
      await db.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating service history record:', error);
    throw error;
  }
}

/**
 * Update an existing service history record
 * @param {number} id - Service history record ID
 * @param {Object} data - Updated service history data
 * @param {Object} user - User updating the record
 * @returns {Promise<Object>} Updated service history record
 */
async function updateServiceHistory(id, data, user) {
  try {
    // Get existing record for audit log
    const existingRecord = await getServiceHistoryById(id);
    
    const { 
      service_type, service_date, mileage, cost,
      technician, location, notes, documents 
    } = data;
    
    // Validate required fields
    if (!service_type || !service_date) {
      throw new Error('Service type and service date are required');
    }
    
    // Update the record
    const result = await db.query(
      `UPDATE service_history 
      SET service_type = $1, service_date = $2, mileage = $3, cost = $4, 
          technician = $5, location = $6, notes = $7, documents = $8
      WHERE id = $9
      RETURNING *`,
      [
        service_type, service_date, mileage, cost,
        technician, location, notes, documents ? JSON.stringify(documents) : existingRecord.documents,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Service history record not found');
    }
    
    // Create audit log
    await createAuditLog({
      user_id: user.id,
      username: user.username,
      action: 'Update',
      page: 'Service History',
      field: 'service_record',
      old_value: JSON.stringify({
        id,
        service_type: existingRecord.service_type,
        service_date: existingRecord.service_date,
        mileage: existingRecord.mileage,
        cost: existingRecord.cost
      }),
      new_value: JSON.stringify({
        id,
        service_type,
        service_date,
        mileage,
        cost
      }),
      ip_address: user.ip,
      user_agent: user.userAgent
    });
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating service history record ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a service history record
 * @param {number} id - Service history record ID
 * @param {Object} user - User deleting the record
 * @returns {Promise<Object>} Deleted service history record
 */
async function deleteServiceHistory(id, user) {
  try {
    // Get existing record for audit log
    const existingRecord = await getServiceHistoryById(id);
    
    const result = await db.query('DELETE FROM service_history WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Service history record not found');
    }
    
    // Create audit log
    await createAuditLog({
      user_id: user.id,
      username: user.username,
      action: 'Delete',
      page: 'Service History',
      field: 'service_record',
      old_value: JSON.stringify({
        id,
        vehicle_id: existingRecord.vehicle_id,
        service_type: existingRecord.service_type,
        service_date: existingRecord.service_date
      }),
      ip_address: user.ip,
      user_agent: user.userAgent
    });
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error deleting service history record ${id}:`, error);
    throw error;
  }
}

module.exports = {
  getServiceHistory,
  getServiceHistoryById,
  createServiceHistory,
  updateServiceHistory,
  deleteServiceHistory
};
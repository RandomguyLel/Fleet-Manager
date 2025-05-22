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
    
    // First check if the service_history_with_vehicles view exists
    try {
      const checkViewQuery = "SELECT to_regclass('public.service_history_with_vehicles') as view_exists";
      const viewCheck = await db.query(checkViewQuery);
      
      if (!viewCheck.rows[0].view_exists) {
        console.error('Service history view does not exist!');
        return []; // Return empty array if view doesn't exist
      }
    } catch (viewCheckError) {
      console.error('Error checking if service history view exists:', viewCheckError);
      return []; // Return empty array on error
    }
    
    let query = 'SELECT * FROM service_history_with_vehicles';
    const params = [];
    
    if (vehicleId) {
      query += ' WHERE vehicle_id = $1';
      params.push(vehicleId);
    }
    
    // Validate sort and order parameters to prevent SQL injection
    const allowedSortFields = ['service_date', 'service_type', 'vehicle_id', 'cost', 'mileage', 'id', 'created_at'];
    const allowedOrderTypes = ['ASC', 'DESC'];
    
    // Default to safe values if invalid parameters are provided
    const safeSort = allowedSortFields.includes(sort) ? sort : 'service_date';
    const safeOrder = allowedOrderTypes.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows || []; // Ensure we always return an array, even if empty
  } catch (error) {
    console.error('Error getting service history:', error);
    return []; // Return empty array on error instead of throwing
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
      technician, location, notes, reminder_id, documents, expense_category 
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
        (vehicle_id, service_type, service_date, mileage, cost, technician, location, notes, expense_category, reminder_id, created_by, documents)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          vehicle_id, service_type, service_date, mileage, cost,
          technician, location, notes, expense_category || null, reminder_id, user.id,
          documents ? JSON.stringify(documents) : null
        ]
      );
      
      // If this service was created from a reminder, mark the reminder as completed
      if (reminder_id) {
        await db.query('UPDATE reminders SET enabled = FALSE WHERE id = $1', [reminder_id]);
      }
      
      // Update vehicle's last service date and mileage
      await db.query(
        'UPDATE vehicles SET lastService = $1, mileage = $2 WHERE id = $3',
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
      technician, location, notes, documents, expense_category 
    } = data;
    
    // Validate required fields
    if (!service_type || !service_date) {
      throw new Error('Service type and service date are required');
    }
    
    // Update the record
    const result = await db.query(
      `UPDATE service_history 
      SET service_type = $1, service_date = $2, mileage = $3, cost = $4, 
          technician = $5, location = $6, notes = $7, documents = $8, expense_category = $9
      WHERE id = $10
      RETURNING *`,
      [
        service_type, service_date, mileage, cost,
        technician, location, notes, documents ? JSON.stringify(documents) : existingRecord.documents,
        expense_category || null,
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
        cost,
        expense_category
      }),
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
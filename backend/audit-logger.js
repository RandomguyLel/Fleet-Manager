const db = require('./db');

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 * @param {number} [logData.user_id] - User ID (if available)
 * @param {string} [logData.username] - Username (if available)
 * @param {string} logData.action - Action performed (Create, Update, Delete, Login, etc.)
 * @param {string} logData.page - Page or section where action occurred
 * @param {string} [logData.field] - Field that was changed (if applicable)
 * @param {string} [logData.old_value] - Previous value (if applicable)
 * @param {string} [logData.new_value] - New value (if applicable)
 * @param {string} [logData.ip_address] - IP address of the user
 * @param {string} [logData.user_agent] - User agent of the browser
 * @param {Object} [logData.details] - Additional details in JSON format
 * @returns {Promise<Object>} The created audit log entry
 */
async function createAuditLog(logData) {
  try {
    const {
      user_id,
      username,
      action,
      page,
      field,
      old_value,
      new_value,
      ip_address,
      user_agent,
      details
    } = logData;

    const result = await db.query(
      `INSERT INTO audit_logs 
       (user_id, username, action, page, field, old_value, new_value, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id || null,
        username || null,
        action,
        page,
        field || null,
        old_value || null,
        new_value || null,
        ip_address || null,
        user_agent || null,
        details ? JSON.stringify(details) : null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of logs to return
 * @param {number} options.offset - Number of logs to skip
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.page] - Filter by page
 * @param {number} [options.user_id] - Filter by user ID
 * @param {string} [options.username] - Filter by username
 * @param {string} [options.startDate] - Filter by start date
 * @param {string} [options.endDate] - Filter by end date
 * @param {string} [options.search] - Search term for field, old_value, or new_value
 * @returns {Promise<Object>} Object with logs array and total count
 */
async function getAuditLogs(options = {}) {
  try {
    const {
      limit = 50,
      offset = 0,
      action,
      page,
      user_id,
      username,
      startDate,
      endDate,
      search
    } = options;

    // Build the query
    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add filters
    if (action) {
      query += ` AND a.action = $${paramIndex++}`;
      params.push(action);
    }
    
    if (page) {
      query += ` AND a.page = $${paramIndex++}`;
      params.push(page);
    }
    
    if (user_id) {
      query += ` AND a.user_id = $${paramIndex++}`;
      params.push(user_id);
    }
    
    if (username) {
      query += ` AND a.username ILIKE $${paramIndex++}`;
      params.push(`%${username}%`);
    }
    
    if (startDate) {
      query += ` AND a.timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND a.timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    if (search) {
      query += ` AND (
        a.field ILIKE $${paramIndex} OR
        a.old_value ILIKE $${paramIndex} OR
        a.new_value ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Count total matching records
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add ORDER BY and LIMIT clauses for the main query
    query += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit);
    params.push(offset);
    
    // Execute main query
    const result = await db.query(query, params);
    
    return {
      logs: result.rows,
      total
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  createAuditLog,
  getAuditLogs
};
// filepath: c:\Users\ritva\Desktop\TMS\Fleet Manager\backend\routes\auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Secret key for JWT signing - in production, this should be in an environment variable
const JWT_SECRET = 'fleet-manager-secret-key';
// Token expiration time - 8 hours
const TOKEN_EXPIRATION = '8h';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      // Check if token exists in database
      const sessionResult = await db.query(
        'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(403).json({ error: 'Session expired or invalid' });
      }
      
      // Get user from database
      const userResult = await db.query(
        'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = TRUE',
        [user.id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(403).json({ error: 'User not found or inactive' });
      }
      
      // Attach user to request
      req.user = userResult.rows[0];
      next();
    });
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to ensure user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }
};

// Helper function to create a notification for disabled user login attempts
const createDisabledUserLoginNotification = async (user) => {
  try {
    const now = new Date();
    await db.query(
      `INSERT INTO notifications 
       (type, title, message, priority, is_read, is_dismissed, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'security', 
        'Disabled Account Login Attempt', 
        `Disabled user ${user.username} (${user.email}) attempted to login at ${now.toLocaleString()}.`, 
        'high',
        false,
        false,
        now
      ]
    );
    console.log(`Created security notification for disabled user login attempt: ${user.username}`);
  } catch (error) {
    console.error('Error creating notification for disabled user login:', error);
  }
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if username or email already exists
    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW()) 
       RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, passwordHash, firstName || null, lastName || null, role || 'user']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in register endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // First check if the user exists without filtering by is_active
    const userExistsResult = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1)',
      [username]
    );
    
    // If no user found at all, return generic error
    if (userExistsResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = userExistsResult.rows[0];
    
    // Check if the user is disabled
    if (!user.is_active) {
      // Check password first to make sure it's the actual user
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (passwordMatch) {
        // Create a notification for admins that a disabled account attempted to login
        await createDisabledUserLoginNotification(user);
        
        // Return a more specific error message
        return res.status(401).json({ error: 'Your account has been disabled. Please contact an administrator.' });
      } else {
        // If password doesn't match, return generic error
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }
    
    // Check password for active user
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours from now
    
    // Store token in the database
    await db.query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );
    
    // Update last login date
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    // Return user data and token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Delete the token from the database
    await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is already attached to the request by the middleware
    res.json(req.user);
  } catch (error) {
    console.error('Error in me endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Get the user with password hash
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in change-password endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile information
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if email is already in use by another user
    if (email !== req.user.email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email is already in use by another user' });
      }
    }
    
    // Update user profile
    const result = await db.query(
      `UPDATE users 
       SET email = $1, first_name = $2, last_name = $3
       WHERE id = $4
       RETURNING id, username, email, first_name, last_name, role`,
      [email, firstName || null, lastName || null, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return updated user data
    const updatedUser = result.rows[0];
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Error in update profile endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add GET endpoint for profile data
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get complete user profile from database
    const userResult = await db.query(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Return user profile data with camelCase property names
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    });
  } catch (error) {
    console.error('Error in get profile endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =================== User Management Routes (Admin Only) ===================

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at, last_login 
       FROM users 
       ORDER BY id`
    );
    
    // Transform to camelCase
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name, 
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific user (admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at, last_login 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Transform to camelCase
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, username } = req.body;
    
    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, manager, or user' });
    }
    
    // Check if username or email already exists
    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW()) 
       RETURNING id, username, email, first_name, last_name, role, is_active, created_at`,
      [username, email, passwordHash, firstName || null, lastName || null, role]
    );
    
    // Transform to camelCase
    const newUser = result.rows[0];
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role,
      isActive: newUser.is_active,
      createdAt: newUser.created_at
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body;
    
    // Get the existing user to ensure we're not modifying the last admin
    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (existingUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already in use by another user
    if (email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email is already in use by another user' });
      }
    }

    // Validate role if it's being changed
    if (role) {
      const validRoles = ['admin', 'manager', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, manager, or user' });
      }
    }
    
    // Update user
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           role = COALESCE($4, role)
       WHERE id = $5
       RETURNING id, username, email, first_name, last_name, role, is_active, created_at, last_login`,
      [
        firstName !== undefined ? firstName : null,
        lastName !== undefined ? lastName : null,
        email || null,
        role || null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to camelCase
    const updatedUser = result.rows[0];
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: updatedUser.role,
      isActive: updatedUser.is_active,
      createdAt: updatedUser.created_at,
      lastLogin: updatedUser.last_login
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle user status (active/inactive) (admin only)
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined || typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive boolean is required' });
    }
    
    // Get the existing user
    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (existingUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existingUser = existingUserResult.rows[0];
    
    // Prevent disabling the last active admin
    if (!isActive && existingUser.role === 'admin') {
      // Count active admins
      const adminCountResult = await db.query(
        'SELECT COUNT(*) FROM users WHERE role = $1 AND is_active = TRUE',
        ['admin']
      );
      
      const adminCount = parseInt(adminCountResult.rows[0].count);
      
      if (adminCount <= 1) {
        return res.status(409).json({ error: 'Cannot disable the last active admin' });
      }
    }
    
    // Update user status
    const result = await db.query(
      `UPDATE users 
       SET is_active = $1
       WHERE id = $2
       RETURNING id, username, email, first_name, last_name, role, is_active`,
      [isActive, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to camelCase
    const updatedUser = result.rows[0];
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: updatedUser.role,
      isActive: updatedUser.is_active,
      message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password for a user (admin only)
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export middleware separately for use in other routes
module.exports = { router, authenticateToken };
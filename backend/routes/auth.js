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
    
    // Get user by username or email
    const userResult = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = TRUE',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
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

// Export middleware separately for use in other routes
module.exports = { router, authenticateToken };
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('./auth');
const { createAuditLog } = require('../audit-logger');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all documents for a vehicle
router.get('/vehicles/:vehicleId/documents', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const result = await db.query(
      'SELECT * FROM documents WHERE vehicle_id = $1 AND is_archived = false ORDER BY uploaded_at DESC',
      [vehicleId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document categories
router.get('/document-categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM document_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching document categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload a new document
router.post('/vehicles/:vehicleId/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { name, description, category, expiryDate } = req.body;
    const file = req.file;

    if (!file) {
      throw new Error('No file uploaded');
    }

    // Insert document record
    const result = await db.query(
      `INSERT INTO documents (
        vehicle_id, name, description, file_path, file_type, file_size,
        uploaded_by, category, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        vehicleId,
        name,
        description,
        file.filename,
        file.mimetype,
        file.size,
        req.user.id,
        category,
        expiryDate || null
      ]
    );

    // Log the action
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE',
      page: 'Documents',
      field: 'Document',
      new_value: name,
      details: {
        vehicle_id: vehicleId,
        document_id: result.rows[0].id,
        category: category
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download a document
router.get('/documents/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];
    const filePath = path.join(__dirname, '../uploads', document.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a document
router.delete('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get document info before deletion
    const docResult = await db.query(
      'SELECT * FROM documents WHERE id = $1',
      [documentId]
    );

    if (docResult.rows.length === 0) {
      throw new Error('Document not found');
    }

    const document = docResult.rows[0];

    // Delete the file
    const filePath = path.join(__dirname, '../uploads', document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await db.query(
      'DELETE FROM documents WHERE id = $1',
      [documentId]
    );

    // Log the action
    await createAuditLog({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE',
      page: 'Documents',
      field: 'Document',
      old_value: document.name,
      details: {
        vehicle_id: document.vehicle_id,
        document_id: documentId,
        category: document.category
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
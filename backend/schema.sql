-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(10) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  lastService VARCHAR(20),
  documents VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  license VARCHAR(20),
  regaplnr VARCHAR(20),
  mileage VARCHAR(20)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user', 
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Create user_sessions table for token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(10) REFERENCES vehicles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(10) REFERENCES vehicles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- e.g., maintenance, insurance, roadworthiness
  title VARCHAR(200) NOT NULL,
  message TEXT,
  message_vars JSONB,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(50), -- For storing username even if user is later deleted
  action VARCHAR(50) NOT NULL, -- Create, Update, Delete, Login, Logout, FailedLogin, etc.
  page VARCHAR(50) NOT NULL, -- Vehicles, Users, Documents, Auth, etc.
  field VARCHAR(50), -- Specific field that was changed (if applicable)
  old_value TEXT, -- Previous value (if applicable)
  new_value TEXT, -- New value (if applicable)
  user_agent TEXT, -- User agent of the browser
  details JSONB -- Additional details in JSON format
);

-- Create user_csdd_credentials table for storing CSDD credentials per user
CREATE TABLE IF NOT EXISTS user_csdd_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create documents table for storing document metadata
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(10) REFERENCES vehicles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(50), -- e.g., 'insurance', 'maintenance', 'registration', 'other'
  expiry_date DATE, -- Optional, for documents that expire
  is_archived BOOLEAN DEFAULT FALSE
);

-- Create document_categories table for predefined categories
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default document categories
INSERT INTO document_categories (name, description) VALUES
  ('Insurance', 'Insurance related documents'),
  ('Maintenance', 'Maintenance and service records'),
  ('Registration', 'Vehicle registration documents'),
  ('Inspection', 'Vehicle inspection reports'),
  ('Other', 'Other vehicle related documents')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users with freshly generated bcrypt hashes
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES 
  ('admin', 'admin@fleetmanager.com', '$2b$10$iqqU7TiRrstPdMcqVzGJceqBtGzBih20B4AlR8J14oLXAymM1e9au', 'Admin', 'User', 'admin'), -- password: admin123
  ('user', 'user@fleetmanager.com', '$2b$10$bw78pDjO1z8dX24qd5.z5OAmRc/yuEucTiuJR49o9YfIftoLrZv9K', 'Regular', 'User', 'user'); -- password: user123

-- Insert sample vehicle data
INSERT INTO vehicles (id, status, type, lastService, documents, make, model, year, license, regaplnr, mileage)
VALUES 
  ('XYZ-123', 'Active', 'Kravas auto', 'Jan 15, 2025', 'Valid', 'Toyota', 'Hino 300', 2023, 'XYZ-123', '1HGCM82633A123456', '45,000 km'),
  ('ABC-789', 'Active', 'Vieglais auto', 'Mar 1, 2025', 'Expiring Soon', 'Mercedes', 'Sprinter', 2022, 'ABC-789', '2FMZA5145XBA12345', '32,500 km'),
  ('DEF-456', 'Inactive', 'Kravas auto', 'Feb 20, 2025', 'Expired', 'Ford', 'Transit', 2021, 'DEF-456', '3VWPD71K27M082526', '58,200 km');

-- Insert sample reminders
INSERT INTO reminders (vehicle_id, name, date, enabled)
VALUES
  ('XYZ-123', 'Insurance Renewal', '2025-12-15', TRUE),
  ('XYZ-123', 'Service Due', '2025-08-20', TRUE),
  ('XYZ-123', 'Road Worthiness Certificate', '2026-01-10', TRUE),
  ('ABC-789', 'Insurance Renewal', '2025-10-05', TRUE),
  ('ABC-789', 'Road Worthiness Certificate', '2025-06-30', TRUE),
  ('DEF-456', 'Service Due', '2025-05-15', FALSE),
  ('DEF-456', 'Road Worthiness Certificate', '2025-04-30', TRUE);
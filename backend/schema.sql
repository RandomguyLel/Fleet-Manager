-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(10) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL,
  "lastService" VARCHAR(20),
  documents VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  license VARCHAR(20),
  vin VARCHAR(20) UNIQUE,
  mileage VARCHAR(20)
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
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample vehicle data
INSERT INTO vehicles (id, status, type, "lastService", documents, make, model, year, license, vin, mileage)
VALUES 
  ('XYZ-123', 'Active', 'Truck', 'Jan 15, 2025', 'Valid', 'Toyota', 'Hino 300', 2023, 'XYZ-123', '1HGCM82633A123456', '45,000 km'),
  ('ABC-789', 'Active', 'Van', 'Mar 1, 2025', 'Expiring Soon', 'Mercedes', 'Sprinter', 2022, 'ABC-789', '2FMZA5145XBA12345', '32,500 km'),
  ('DEF-456', 'Inactive', 'Truck', 'Feb 20, 2025', 'Expired', 'Ford', 'Transit', 2021, 'DEF-456', '3VWPD71K27M082526', '58,200 km');

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
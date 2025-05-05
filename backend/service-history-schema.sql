-- Create service_history table
CREATE TABLE IF NOT EXISTS service_history (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(10) REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL, -- e.g., Oil Change, Tire Rotation, Brake Service
  service_date DATE NOT NULL,
  mileage INTEGER,
  cost DECIMAL(10, 2),
  technician VARCHAR(100),
  location VARCHAR(100),
  notes TEXT,
  reminder_id INTEGER REFERENCES reminders(id) ON DELETE SET NULL, -- Optional link to the reminder that prompted this service
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  documents JSONB -- For storing links to attached documents, photos, or invoices
);

-- Create an index on vehicle_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_history_vehicle_id ON service_history(vehicle_id);

-- Add a view that combines service history with vehicle information
CREATE OR REPLACE VIEW service_history_with_vehicles AS
SELECT 
  sh.*,
  v.make,
  v.model,
  v.year,
  v.regaplnr
FROM service_history sh
JOIN vehicles v ON sh.vehicle_id = v.id;
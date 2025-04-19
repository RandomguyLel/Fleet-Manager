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

-- Insert sample vehicle data
INSERT INTO vehicles (id, status, type, "lastService", documents, make, model, year, license, vin, mileage)
VALUES 
  ('XYZ-123', 'Active', 'Truck', 'Jan 15, 2025', 'Valid', 'Toyota', 'Hino 300', 2023, 'XYZ-123', '1HGCM82633A123456', '45,000 km'),
  ('ABC-789', 'Active', 'Van', 'Mar 1, 2025', 'Expiring Soon', 'Mercedes', 'Sprinter', 2022, 'ABC-789', '2FMZA5145XBA12345', '32,500 km'),
  ('DEF-456', 'Inactive', 'Truck', 'Feb 20, 2025', 'Expired', 'Ford', 'Transit', 2021, 'DEF-456', '3VWPD71K27M082526', '58,200 km');
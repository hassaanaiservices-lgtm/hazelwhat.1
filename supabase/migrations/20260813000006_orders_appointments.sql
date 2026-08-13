-- Orders and Appointments Operational Features Migration
-- Migration Name: 20260813000006_orders_appointments.sql

-- Add items_description, quantity, and notes to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items_description TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add service and notes to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Indexes for status lookups per tenant
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(tenant_id, status);

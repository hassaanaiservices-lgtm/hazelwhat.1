-- Autopilot & Copilot Controls Migration
-- Migration Name: 20260813000005_autopilot_controls.sql

-- Add needs_human_attention and is_human_handled columns to customers table if they do not exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS needs_human_attention BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_human_handled BOOLEAN NOT NULL DEFAULT false;

-- Index for fast inbox filtering of conversations needing human attention
CREATE INDEX IF NOT EXISTS idx_customers_needs_human ON customers(tenant_id, needs_human_attention);

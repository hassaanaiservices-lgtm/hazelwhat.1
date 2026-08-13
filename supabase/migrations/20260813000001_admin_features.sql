-- Admin Features & Audit Logging Migration
-- Migration Name: 20260813000001_admin_features.sql

-- Add status and subscription_status columns to tenants table if they do not exist
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled'));

-- CREATE ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user TEXT NOT NULL DEFAULT 'system_admin',
    action TEXT NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_audit_logs (Admin role only)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_logs_isolation ON admin_audit_logs
    FOR ALL
    USING (
        (auth.jwt() ->> 'role') = 'admin'
    );

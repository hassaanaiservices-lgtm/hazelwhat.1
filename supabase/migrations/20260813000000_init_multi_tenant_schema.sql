-- Core Multi-Tenant Database Schema Migration
-- Migration Name: 20260813000000_init_multi_tenant_schema.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'business', 'bot')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TENANT CONFIGS TABLE
CREATE TABLE IF NOT EXISTS tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR MULTI-TENANT QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant_id ON tenant_configs(tenant_id);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TENANT TABLES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR TENANTS
-- Allows access if the request header or app setting matches the tenant_id, or if authenticated as admin claim
CREATE POLICY tenants_tenant_isolation ON tenants
    FOR ALL
    USING (
        id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- RLS POLICIES FOR CUSTOMERS
CREATE POLICY customers_tenant_isolation ON customers
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- RLS POLICIES FOR CHAT MESSAGES
CREATE POLICY chat_messages_tenant_isolation ON chat_messages
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- RLS POLICIES FOR ORDERS
CREATE POLICY orders_tenant_isolation ON orders
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- RLS POLICIES FOR APPOINTMENTS
CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

-- RLS POLICIES FOR TENANT CONFIGS
CREATE POLICY tenant_configs_tenant_isolation ON tenant_configs
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

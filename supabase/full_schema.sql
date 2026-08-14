-- Full Consolidated Schema Migration for HazelWhat Multi-Tenant Platform
-- Execute this script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynocyenhftcexypqmiu/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
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
    needs_human_attention BOOLEAN NOT NULL DEFAULT false,
    is_human_handled BOOLEAN NOT NULL DEFAULT false,
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
    message_id TEXT UNIQUE,
    media_url TEXT,
    media_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
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
    service TEXT,
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

-- 7. KNOWLEDGE BASE TABLE
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('faq', 'policy', 'product', 'document')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_content_hash UNIQUE (tenant_id, content_hash)
);

-- 8. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user TEXT NOT NULL DEFAULT 'system_admin',
    action TEXT NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AI CIRCUIT BREAKER LOGS TABLE
CREATE TABLE IF NOT EXISTS ai_circuit_breaker_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL CHECK (provider_name IN ('DeepSeek', 'OpenAI')),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'RECOVERED')),
    error_reason TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_needs_human ON customers(tenant_id, needs_human_attention);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_id ON chat_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_media ON chat_messages(tenant_id, media_type);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant_id ON tenant_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_tenant_id ON knowledge_base_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_entry_type ON knowledge_base_entries(tenant_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_circuit_logs_provider ON ai_circuit_breaker_logs(provider_name, expires_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_circuit_breaker_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenants_tenant_isolation') THEN
        CREATE POLICY tenants_tenant_isolation ON tenants FOR ALL USING (
            id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customers_tenant_isolation') THEN
        CREATE POLICY customers_tenant_isolation ON customers FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chat_messages_tenant_isolation') THEN
        CREATE POLICY chat_messages_tenant_isolation ON chat_messages FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'orders_tenant_isolation') THEN
        CREATE POLICY orders_tenant_isolation ON orders FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'appointments_tenant_isolation') THEN
        CREATE POLICY appointments_tenant_isolation ON appointments FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_configs_tenant_isolation') THEN
        CREATE POLICY tenant_configs_tenant_isolation ON tenant_configs FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_entries_tenant_isolation') THEN
        CREATE POLICY kb_entries_tenant_isolation ON knowledge_base_entries FOR ALL USING (
            tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
            OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
            OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
            OR (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_audit_logs_isolation') THEN
        CREATE POLICY admin_audit_logs_isolation ON admin_audit_logs FOR ALL USING (
            (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_circuit_logs_admin') THEN
        CREATE POLICY ai_circuit_logs_admin ON ai_circuit_breaker_logs FOR ALL USING (
            (auth.jwt() ->> 'role') = 'admin'
        );
    END IF;
END $$;

-- INITIAL SEED DATA (Demo Tenant & Sample Customer)
INSERT INTO tenants (id, name, slug, status, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Enterprise Tenant', 'demo-tenant', 'active', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenant_configs (tenant_id, business_name, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Enterprise Store',
    '{"autopilot_enabled": true, "ai_personality": "Friendly Assistant"}'::jsonb
)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO customers (id, tenant_id, name, phone_number, email)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Alice Johnson',
    '+92 300 1234567',
    'alice@example.com'
)
ON CONFLICT (id) DO NOTHING;

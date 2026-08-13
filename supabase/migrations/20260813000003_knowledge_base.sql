-- Knowledge Base & Product Catalog Migration
-- Migration Name: 20260813000003_knowledge_base.sql

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

-- INDEXES FOR FAST TENANT QUERY AND HASH LOOKUP
CREATE INDEX IF NOT EXISTS idx_kb_entries_tenant_id ON knowledge_base_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_entry_type ON knowledge_base_entries(tenant_id, entry_type);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY kb_entries_tenant_isolation ON knowledge_base_entries
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('request.headers', true)::json->>'x-tenant-id', '')::uuid
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
        OR (auth.jwt() ->> 'role') = 'admin'
    );

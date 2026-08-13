-- AI Circuit Breaker & Health Logging Migration
-- Migration Name: 20260813000004_circuit_breaker.sql

CREATE TABLE IF NOT EXISTS ai_circuit_breaker_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL CHECK (provider_name IN ('DeepSeek', 'OpenAI')),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'RECOVERED')),
    error_reason TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- INDEXES FOR FAST PROVIDER HEALTH QUERY
CREATE INDEX IF NOT EXISTS idx_circuit_logs_provider ON ai_circuit_breaker_logs(provider_name, expires_at);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE ai_circuit_breaker_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_circuit_logs_admin ON ai_circuit_breaker_logs
    FOR ALL
    USING (
        (auth.jwt() ->> 'role') = 'admin'
    );

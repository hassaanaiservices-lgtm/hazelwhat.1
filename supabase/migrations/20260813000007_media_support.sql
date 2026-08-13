-- Media Support Migration for Chat Messages
-- Migration Name: 20260813000007_media_support.sql

-- Add media_url and media_type columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Index for filtering media messages per tenant
CREATE INDEX IF NOT EXISTS idx_chat_messages_media ON chat_messages(tenant_id, media_type);

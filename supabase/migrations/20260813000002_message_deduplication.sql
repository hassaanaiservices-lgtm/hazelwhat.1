-- Message Deduplication Migration
-- Migration Name: 20260813000002_message_deduplication.sql

-- Add message_id column to chat_messages table if it does not exist
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS message_id TEXT UNIQUE;

-- Index on message_id for fast deduplication lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_id ON chat_messages(message_id);

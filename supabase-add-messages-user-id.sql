-- Add user_id column to messages table for shared AI chat
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
  END IF;
END $$;

-- Update RLS policies to allow collaborators to view and create messages
DROP POLICY IF EXISTS "Users and collaborators can view messages" ON messages;
CREATE POLICY "Users and collaborators can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = messages.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'accepted'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users and collaborators can create messages" ON messages;
CREATE POLICY "Users and collaborators can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = messages.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'accepted'
        )
      )
    )
    AND (
      messages.role = 'assistant'
      OR messages.user_id = auth.uid()
    )
  );

-- Enable Realtime for messages table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN
    -- Already added, nothing to do
    NULL;
  WHEN undefined_table THEN
    -- Table doesn't exist yet, skip
    NULL;
END $$;


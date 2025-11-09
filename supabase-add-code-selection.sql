-- Add code selection fields to project_chat_messages table
-- Run this in your Supabase SQL Editor

-- Add columns for code selection if they don't exist
DO $$
BEGIN
  -- Add code_selection column (stores selected code snippet)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_chat_messages' 
    AND column_name = 'code_selection'
  ) THEN
    ALTER TABLE project_chat_messages 
    ADD COLUMN code_selection TEXT;
  END IF;

  -- Add code_selection_start_line column (line number where selection starts)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_chat_messages' 
    AND column_name = 'code_selection_start_line'
  ) THEN
    ALTER TABLE project_chat_messages 
    ADD COLUMN code_selection_start_line INTEGER;
  END IF;

  -- Add code_selection_end_line column (line number where selection ends)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_chat_messages' 
    AND column_name = 'code_selection_end_line'
  ) THEN
    ALTER TABLE project_chat_messages 
    ADD COLUMN code_selection_end_line INTEGER;
  END IF;
END $$;


-- Enable Realtime for projects table
-- This is required for real-time code synchronization
-- Run this in your Supabase SQL Editor

-- Enable Realtime for projects table
DO $$
BEGIN
  -- Add projects table to Realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  RAISE NOTICE 'Projects table added to Realtime publication';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Projects table is already in Realtime publication';
  WHEN undefined_table THEN
    RAISE NOTICE 'Projects table does not exist yet. Run supabase-schema.sql first.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding projects to Realtime: %', SQLERRM;
END $$;

-- Verify Realtime is enabled
-- You can check this in Supabase Dashboard: Database > Replication
-- The projects table should be listed there


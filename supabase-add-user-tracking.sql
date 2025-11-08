-- Add user_id column to code_versions table to track who created each version
-- Run this in your Supabase SQL Editor

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'code_versions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE code_versions 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_code_versions_user_id ON code_versions(user_id);
    
    -- Update existing rows to set user_id from project owner (if possible)
    UPDATE code_versions cv
    SET user_id = p.user_id
    FROM projects p
    WHERE cv.project_id = p.id
    AND cv.user_id IS NULL;
  END IF;
END $$;

-- Update RLS policies to allow collaborators to view versions
DROP POLICY IF EXISTS "Users and collaborators can view code versions" ON code_versions;
CREATE POLICY "Users and collaborators can view code versions"
  ON code_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = code_versions.project_id
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

-- Update RLS policy to allow collaborators to create versions
DROP POLICY IF EXISTS "Users and collaborators can create code versions" ON code_versions;
CREATE POLICY "Users and collaborators can create code versions"
  ON code_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = code_versions.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'accepted'
          AND pc.role IN ('owner', 'edit')
        )
      )
    )
    AND code_versions.user_id = auth.uid()
  );


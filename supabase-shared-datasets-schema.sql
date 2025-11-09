-- Create shared_datasets table for sharing datasets within projects
-- Run this in your Supabase SQL Editor

-- Create shared_datasets table
CREATE TABLE IF NOT EXISTS shared_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  csv_text TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  include_chat BOOLEAN DEFAULT true,
  include_run BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_datasets_project_id ON shared_datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_shared_datasets_user_id ON shared_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_datasets_created_at ON shared_datasets(created_at);

-- Enable Row Level Security
ALTER TABLE shared_datasets ENABLE ROW LEVEL SECURITY;

-- Create or replace SECURITY DEFINER function to check if user can view project
CREATE OR REPLACE FUNCTION public.can_view_shared_datasets_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_uuid
      AND (
        p.user_id = user_uuid
        OR EXISTS (
          SELECT 1
          FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
            AND pc.user_id = user_uuid
            AND pc.status = 'accepted'
        )
      )
  );
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.can_view_shared_datasets_project(UUID, UUID) TO authenticated, anon;

-- Create or replace SECURITY DEFINER function to check if user can edit project
CREATE OR REPLACE FUNCTION public.can_edit_shared_datasets_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_uuid
      AND (
        p.user_id = user_uuid
        OR EXISTS (
          SELECT 1
          FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
            AND pc.user_id = user_uuid
            AND pc.status = 'accepted'
            AND pc.role IN ('owner', 'edit')
        )
      )
  );
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.can_edit_shared_datasets_project(UUID, UUID) TO authenticated, anon;

-- RLS Policy: Collaborators can view shared datasets
DROP POLICY IF EXISTS "Collaborators can view shared datasets" ON shared_datasets;
CREATE POLICY "Collaborators can view shared datasets"
  ON shared_datasets FOR SELECT
  USING (public.can_view_shared_datasets_project(shared_datasets.project_id, auth.uid()));

-- RLS Policy: Owners and editors can insert shared datasets
DROP POLICY IF EXISTS "Owners and editors can insert shared datasets" ON shared_datasets;
CREATE POLICY "Owners and editors can insert shared datasets"
  ON shared_datasets FOR INSERT
  WITH CHECK (
    public.can_edit_shared_datasets_project(shared_datasets.project_id, auth.uid())
    AND shared_datasets.user_id = auth.uid()
  );

-- RLS Policy: Owners and editors can update shared datasets (only their own)
DROP POLICY IF EXISTS "Owners and editors can update shared datasets" ON shared_datasets;
CREATE POLICY "Owners and editors can update shared datasets"
  ON shared_datasets FOR UPDATE
  USING (
    public.can_edit_shared_datasets_project(shared_datasets.project_id, auth.uid())
    AND shared_datasets.user_id = auth.uid()
  );

-- RLS Policy: Owners and editors can delete shared datasets (only their own)
DROP POLICY IF EXISTS "Owners and editors can delete shared datasets" ON shared_datasets;
CREATE POLICY "Owners and editors can delete shared datasets"
  ON shared_datasets FOR DELETE
  USING (
    public.can_edit_shared_datasets_project(shared_datasets.project_id, auth.uid())
    AND shared_datasets.user_id = auth.uid()
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_datasets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shared_datasets_updated_at_trigger ON shared_datasets;
CREATE TRIGGER update_shared_datasets_updated_at_trigger
  BEFORE UPDATE ON shared_datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_datasets_updated_at();

-- Enable Realtime for shared_datasets table
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shared_datasets;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'shared_datasets table is already in supabase_realtime publication.';
  WHEN undefined_table THEN
    RAISE NOTICE 'shared_datasets table does not exist yet.';
END $$;


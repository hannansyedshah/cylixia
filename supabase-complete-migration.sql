-- ============================================================================
-- COMPLETE SUPABASE MIGRATION FILE
-- ============================================================================
-- This file contains all the SQL needed to set up your Supabase database
-- Run this entire file in your new Supabase project's SQL Editor
-- ============================================================================
-- Generated: 2025-11-10T13:41:20.681Z
-- ============================================================================


-- ============================================================================
-- File: supabase-schema.sql
-- ============================================================================

-- Run this in your Supabase SQL Editor to set up the database

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT DEFAULT '# Your R code will appear here',
  plot_url TEXT,
  dataset TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  code TEXT,
  plot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create code_versions table for version history
CREATE TABLE IF NOT EXISTS code_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  code TEXT NOT NULL,
  plot_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
-- Ensure project names are unique per user
DO $$
BEGIN
  ALTER TABLE projects ADD CONSTRAINT unique_project_name_per_user UNIQUE (user_id, name);
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists; nothing to do
    NULL;
  WHEN unique_violation THEN
    -- Duplicates exist; skip adding constraint and show a notice
    RAISE NOTICE 'Skipped adding unique_project_name_per_user due to duplicate (user_id, name) rows. Deduplicate then re-run.';
END $$;
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_code_versions_project_id ON code_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_code_versions_version_number ON code_versions(project_id, version_number);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for messages table
DROP POLICY IF EXISTS "Users can view messages in their projects" ON messages;
CREATE POLICY "Users can view messages in their projects"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create messages in their projects" ON messages;
CREATE POLICY "Users can create messages in their projects"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete messages in their projects" ON messages;
CREATE POLICY "Users can delete messages in their projects"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policies for code_versions table
DROP POLICY IF EXISTS "Users can view code versions in their projects" ON code_versions;
CREATE POLICY "Users can view code versions in their projects"
  ON code_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create code versions in their projects" ON code_versions;
CREATE POLICY "Users can create code versions in their projects"
  ON code_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update code versions in their projects" ON code_versions;
CREATE POLICY "Users can update code versions in their projects"
  ON code_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete code versions in their projects" ON code_versions;
CREATE POLICY "Users can delete code versions in their projects"
  ON code_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- (storage bucket/policies for datasets removed for now)

-- (project_datasets table and policies removed for now)




-- ============================================================================
-- File: supabase-collaboration-schema.sql
-- ============================================================================

-- Run this in your Supabase SQL Editor to add collaboration and profile features
-- This extends the existing supabase-schema.sql

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update projects table - add is_shared column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- 3. Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'edit', 'view')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. Create collaboration_requests table
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('edit', 'view')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, from_user_id, to_user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- 5. Create project_chat_messages table
CREATE TABLE IF NOT EXISTS project_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_project_id ON collaboration_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_from_user_id ON collaboration_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_to_user_id ON collaboration_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project_id ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_created_at ON project_chat_messages(project_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- Users can read all profiles (for search)
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for project_collaborators table
-- Collaborators can view collaborators for projects they're part of
-- Fixed: Avoid infinite recursion by checking projects table first and allowing users to see their own rows
DROP POLICY IF EXISTS "Collaborators can view project collaborators" ON project_collaborators;
CREATE POLICY "Collaborators can view project collaborators"
  ON project_collaborators FOR SELECT
  USING (
    -- Users can always see their own collaboration rows
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can insert collaborators
-- Fixed: Only check projects table to avoid recursion
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
CREATE POLICY "Project owners can add collaborators"
  ON project_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can update collaborators
-- Fixed: Only check projects table to avoid recursion
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
CREATE POLICY "Project owners can update collaborators"
  ON project_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can update their own collaboration status (accept/decline)
DROP POLICY IF EXISTS "Users can update their own collaboration status" ON project_collaborators;
CREATE POLICY "Users can update their own collaboration status"
  ON project_collaborators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project owners can delete collaborators
-- Fixed: Only check projects table to avoid recursion
DROP POLICY IF EXISTS "Project owners can delete collaborators" ON project_collaborators;
CREATE POLICY "Project owners can delete collaborators"
  ON project_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for collaboration_requests table
-- Users can view requests they sent or received
DROP POLICY IF EXISTS "Users can view their collaboration requests" ON collaboration_requests;
CREATE POLICY "Users can view their collaboration requests"
  ON collaboration_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create collaboration requests
-- Fixed: Only check projects table to avoid recursion
DROP POLICY IF EXISTS "Users can create collaboration requests" ON collaboration_requests;
CREATE POLICY "Users can create collaboration requests"
  ON collaboration_requests FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaboration_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can update requests they received (accept/decline)
DROP POLICY IF EXISTS "Users can update received requests" ON collaboration_requests;
CREATE POLICY "Users can update received requests"
  ON collaboration_requests FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Users can update requests they sent (cancel)
DROP POLICY IF EXISTS "Users can cancel their sent requests" ON collaboration_requests;
CREATE POLICY "Users can cancel their sent requests"
  ON collaboration_requests FOR UPDATE
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies for project_chat_messages table
-- Collaborators can read messages for projects they're part of
-- Fixed: Use a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.can_view_project_messages(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is project owner
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_uuid
    AND user_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a collaborator
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Collaborators can read chat messages" ON project_chat_messages;
CREATE POLICY "Collaborators can read chat messages"
  ON project_chat_messages FOR SELECT
  USING (
    -- Users can see messages they sent
    user_id = auth.uid()
    OR public.can_view_project_messages(project_chat_messages.project_id, auth.uid())
  );

-- Collaborators can write messages for projects they're part of
-- Fixed: Use a SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "Collaborators can write chat messages" ON project_chat_messages;
CREATE POLICY "Collaborators can write chat messages"
  ON project_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_view_project_messages(project_chat_messages.project_id, auth.uid())
  );

-- Update projects RLS policies to allow collaborators to view/edit
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users and collaborators can view projects" ON projects;
DROP POLICY IF EXISTS "Users and collaborators can update projects" ON projects;

-- New policy: Users and collaborators can view projects
-- Fixed: Use a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_project_collaborator(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has a pending invite for a project
CREATE OR REPLACE FUNCTION public.has_pending_invite(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE project_id = project_uuid
    AND to_user_id = user_uuid
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users and collaborators can view projects" ON projects;
CREATE POLICY "Users and collaborators can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_project_collaborator(projects.id, auth.uid())
    OR public.has_pending_invite(projects.id, auth.uid())
  );

-- New policy: Users and collaborators with edit/owner role can update projects
-- Fixed: Use a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.can_edit_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND role IN ('owner', 'edit')
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users and collaborators can update projects" ON projects;
CREATE POLICY "Users and collaborators can update projects"
  ON projects FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.can_edit_project(projects.id, auth.uid())
  );

-- Create trigger to update updated_at for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for project_collaborators
DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for collaboration_requests
DROP TRIGGER IF EXISTS update_collaboration_requests_updated_at ON collaboration_requests;
CREATE TRIGGER update_collaboration_requests_updated_at
  BEFORE UPDATE ON collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically add project owner as collaborator
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if project_collaborators table exists
  BEGIN
    INSERT INTO public.project_collaborators (project_id, user_id, role, status)
    VALUES (NEW.id, NEW.user_id, 'owner', 'accepted')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, skip
      NULL;
    WHEN OTHERS THEN
      -- Other errors, log but don't fail
      RAISE WARNING 'Could not add owner as collaborator: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add owner as collaborator when project is created
-- Only create trigger if project_collaborators table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_collaborators'
  ) THEN
    DROP TRIGGER IF EXISTS on_project_created ON projects;
    CREATE TRIGGER on_project_created
      AFTER INSERT ON projects
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_project();
  END IF;
END $$;

-- Enable Realtime for tables (if they exist)
DO $$
BEGIN
  -- Add projects table to Realtime (if not already added)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
  
  -- Add project_chat_messages table to Realtime (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_chat_messages'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_messages;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
  
  -- Add project_collaborators table to Realtime (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_collaborators'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Function to get user by email (for invitation system)
-- This function allows looking up users by email address
-- Note: This function requires SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT) AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  -- Normalize the email
  normalized_email := LOWER(TRIM(user_email));
  
  -- Query auth.users table
  RETURN QUERY
  SELECT 
    au.id::UUID, 
    au.email::TEXT
  FROM auth.users au
  WHERE LOWER(TRIM(au.email)) = normalized_email
  LIMIT 1;
  
  -- If no results, return empty
  RETURN;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE EXCEPTION 'Function does not have permission to access auth.users';
  WHEN OTHERS THEN
    -- Log the error but return empty result
    RAISE WARNING 'Error in get_user_by_email: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO service_role;

-- Grant execute permissions on all collaboration functions
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO anon;

-- Note: If the above ALTER PUBLICATION commands fail, you may need to enable Realtime manually in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Enable Realtime for: projects, project_chat_messages, project_collaborators




-- ============================================================================
-- File: supabase-shared-datasets-schema.sql
-- ============================================================================

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




-- ============================================================================
-- File: supabase-enable-realtime.sql
-- ============================================================================

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




-- ============================================================================
-- File: supabase-complete-setup.sql
-- ============================================================================

-- ============================================================================
-- COMPLETE SUPABASE SETUP FOR cReate
-- ============================================================================
-- Run this file in your Supabase SQL Editor to set up all necessary
-- tables, functions, policies, and triggers for the cReate application.
--
-- IMPORTANT: Run these files in order:
-- 1. supabase-schema.sql (base tables and functions)
-- 2. supabase-collaboration-schema.sql (collaboration features)
-- 3. supabase-shared-datasets-schema.sql (shared datasets feature)
-- 4. This file (complete setup with all functions and grants)
-- ============================================================================

-- Grant execute permissions on all functions
-- This ensures all functions are accessible to authenticated users

-- Grant permissions for collaboration functions
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO service_role;

-- Grant permissions for shared datasets functions (if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'can_view_shared_datasets_project'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.can_view_shared_datasets_project(UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.can_view_shared_datasets_project(UUID, UUID) TO anon;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'can_edit_shared_datasets_project'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.can_edit_shared_datasets_project(UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.can_edit_shared_datasets_project(UUID, UUID) TO anon;
  END IF;
END $$;

-- Ensure all necessary functions exist
-- Create has_pending_invite if it doesn't exist (from fix)
CREATE OR REPLACE FUNCTION public.has_pending_invite(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE project_id = project_uuid
    AND to_user_id = user_uuid
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure is_project_collaborator exists
CREATE OR REPLACE FUNCTION public.is_project_collaborator(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure can_edit_project exists
CREATE OR REPLACE FUNCTION public.can_edit_project(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND role IN ('owner', 'edit')
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure can_view_project_messages exists
CREATE OR REPLACE FUNCTION public.can_view_project_messages(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is project owner
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_uuid
    AND user_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a collaborator
  RETURN EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = project_uuid
    AND user_id = user_uuid
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure get_user_by_email exists
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT) AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  -- Normalize the email
  normalized_email := LOWER(TRIM(user_email));
  
  -- Query auth.users table
  RETURN QUERY
  SELECT 
    au.id::UUID, 
    au.email::TEXT
  FROM auth.users au
  WHERE LOWER(TRIM(au.email)) = normalized_email
  LIMIT 1;
  
  -- If no results, return empty
  RETURN;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE EXCEPTION 'Function does not have permission to access auth.users';
  WHEN OTHERS THEN
    -- Log the error but return empty result
    RAISE WARNING 'Error in get_user_by_email: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure update_updated_at_column exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update projects policy to include has_pending_invite
DROP POLICY IF EXISTS "Users and collaborators can view projects" ON projects;
CREATE POLICY "Users and collaborators can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_project_collaborator(projects.id, auth.uid())
    OR public.has_pending_invite(projects.id, auth.uid())
  );

-- Grant all permissions again to ensure they're set
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pending_invite(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_project(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_project_messages(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All functions, policies, and permissions have been set up.
-- Your cReate application should now work with all collaboration features.
-- ============================================================================




-- ============================================================================
-- Optional File: supabase-add-code-selection.sql
-- ============================================================================

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




-- ============================================================================
-- Optional File: supabase-add-messages-user-id.sql
-- ============================================================================

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




-- ============================================================================
-- Optional File: supabase-add-user-tracking.sql
-- ============================================================================

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




-- ============================================================================
-- Optional File: supabase-setup-storage.sql
-- ============================================================================

-- Setup Supabase Storage for avatars
-- Run this in your Supabase SQL Editor

-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so avatars can be accessed via URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create storage policy: Authenticated users can upload their own avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy: Users can update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policy: Users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);




-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update your .env.local with new Supabase credentials
-- 2. Enable Realtime for 'projects' table in Database > Replication
-- 3. Test your application
-- ============================================================================

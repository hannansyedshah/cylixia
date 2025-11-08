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

DROP POLICY IF EXISTS "Users and collaborators can view projects" ON projects;
CREATE POLICY "Users and collaborators can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_project_collaborator(projects.id, auth.uid())
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
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(user_email);
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty result on error
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO anon;

-- Note: If the above ALTER PUBLICATION commands fail, you may need to enable Realtime manually in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Enable Realtime for: projects, project_chat_messages, project_collaborators


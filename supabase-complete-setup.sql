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


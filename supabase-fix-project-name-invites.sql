-- Fix: Allow users to see project names for projects they have pending invites for
-- This fixes the issue where collaboration requests show "Unnamed Project" 
-- even when the project has a name

-- Add a function to check if user has a pending invite for a project
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

-- Update the projects SELECT policy to allow users with pending invites to see project names
DROP POLICY IF EXISTS "Users and collaborators can view projects" ON projects;
CREATE POLICY "Users and collaborators can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_project_collaborator(projects.id, auth.uid())
    OR public.has_pending_invite(projects.id, auth.uid())
  );


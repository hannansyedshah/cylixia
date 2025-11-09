# Supabase Setup Order

Run these SQL files in your Supabase SQL Editor in the following order:

## 1. Base Schema
**File:** `supabase-schema.sql`
- Creates base tables (projects, messages, code_versions)
- Sets up basic RLS policies
- Creates `update_updated_at_column()` function

## 2. Collaboration Schema
**File:** `supabase-collaboration-schema.sql`
- Creates collaboration tables (profiles, project_collaborators, collaboration_requests, project_chat_messages)
- Sets up collaboration RLS policies
- Creates collaboration functions:
  - `is_project_collaborator()`
  - `has_pending_invite()`
  - `can_edit_project()`
  - `can_view_project_messages()`
  - `get_user_by_email()`
- Grants execute permissions on all functions

## 3. Shared Datasets Schema
**File:** `supabase-shared-datasets-schema.sql`
- Creates `shared_datasets` table
- Sets up shared datasets RLS policies
- Creates shared datasets functions:
  - `can_view_shared_datasets_project()`
  - `can_edit_shared_datasets_project()`

## 4. Complete Setup (Optional - for verification)
**File:** `supabase-complete-setup.sql`
- Verifies all functions exist
- Re-grants all permissions
- Updates projects policy to include `has_pending_invite`
- Use this if you want to ensure everything is set up correctly

## Quick Setup (All-in-One)

If you want to run everything at once, you can:

1. Run `supabase-schema.sql`
2. Run `supabase-collaboration-schema.sql`
3. Run `supabase-shared-datasets-schema.sql`
4. (Optional) Run `supabase-complete-setup.sql` to verify

## Important Notes

- All functions are created with `SECURITY DEFINER` to allow them to check permissions
- All functions have `GRANT EXECUTE` permissions for `authenticated` and `anon` roles
- The `has_pending_invite()` function allows users to see project names for pending invites
- The `get_user_by_email()` function is used for the invitation system

## Troubleshooting

If you get permission errors:
1. Make sure you're running the SQL as a database admin
2. Check that all functions have `GRANT EXECUTE` permissions
3. Verify RLS policies are enabled on all tables

If Realtime doesn't work:
1. Go to Database > Replication in Supabase Dashboard
2. Enable Realtime for: `projects`, `project_chat_messages`, `project_collaborators`, `shared_datasets`


-- Add context_window field to projects table for HIPAA-compliant research context
-- This stores the user-confirmed research context that AI uses for all code generation

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS context_window TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN projects.context_window IS 'Stores the research context for HIPAA projects (study type, objectives, dataset fields, analysis preferences)';


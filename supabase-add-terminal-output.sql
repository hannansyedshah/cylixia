-- Add terminal output columns to projects table for real-time sharing
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stdout TEXT,
ADD COLUMN IF NOT EXISTS stderr TEXT;

-- Add comment
COMMENT ON COLUMN projects.stdout IS 'Standard output from code execution, shared in real-time';
COMMENT ON COLUMN projects.stderr IS 'Standard error output from code execution, shared in real-time';


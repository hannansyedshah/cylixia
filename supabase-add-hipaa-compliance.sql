-- Add HIPAA/NIST compliance mode column to projects table
-- Run this in your Supabase SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS hipaa_compliant BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN projects.hipaa_compliant IS 'Indicates if this project requires HIPAA/NIST compliance mode with automatic PHI redaction';


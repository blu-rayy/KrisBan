-- Alter progress_reports table to add sprint_id foreign key
-- Run this in Supabase SQL Editor if progress_reports table already exists

ALTER TABLE progress_reports 
ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Create index for the new sprint_id column
CREATE INDEX IF NOT EXISTS idx_progress_reports_sprint_id ON progress_reports(sprint_id);

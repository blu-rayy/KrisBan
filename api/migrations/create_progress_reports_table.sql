-- Progress Reports Table SQL Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sprint_no VARCHAR(20) NOT NULL,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  team_plan TEXT DEFAULT '',
  category VARCHAR(100) NOT NULL,
  task_done TEXT NOT NULL,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_progress_reports_date ON progress_reports(date);
CREATE INDEX idx_progress_reports_member_id ON progress_reports(member_id);
CREATE INDEX idx_progress_reports_sprint_no ON progress_reports(sprint_no);
CREATE INDEX idx_progress_reports_sprint_id ON progress_reports(sprint_id);
CREATE INDEX idx_progress_reports_category ON progress_reports(category);
CREATE INDEX idx_progress_reports_created_by ON progress_reports(created_by);
CREATE INDEX idx_progress_reports_created_at ON progress_reports(created_at);

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

-- Sample data (optional)
-- INSERT INTO progress_reports (date, member_id, sprint_no, team_plan, category, task_done, created_by)
-- VALUES 
--   ('2025-02-16', 'member-uuid-1', 'Sprint 1', 'Team Plan A', 'Software Development', 'Completed task 1', 'user-uuid-1'),
--   ('2025-02-16', 'member-uuid-2', 'Sprint 1', 'Team Plan B', 'Research', 'Completed task 2', 'user-uuid-2');

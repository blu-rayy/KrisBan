-- Migration: Add team_plan_id foreign key to progress_reports
-- This creates the relationship between progress_reports and sprint_team_plans
-- Allowing us to fetch the current team plan values instead of denormalized text

-- Add the new column
ALTER TABLE public.progress_reports
ADD COLUMN team_plan_id UUID,
ADD CONSTRAINT fk_progress_reports_team_plan 
FOREIGN KEY (team_plan_id) 
REFERENCES public.sprint_team_plans(id) 
ON DELETE SET NULL;

-- Create an index for better performance
CREATE INDEX idx_progress_reports_team_plan_id ON public.progress_reports(team_plan_id);

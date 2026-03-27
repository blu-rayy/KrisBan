-- Add is_completed flag to kanban tickets
ALTER TABLE kanban_tickets ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

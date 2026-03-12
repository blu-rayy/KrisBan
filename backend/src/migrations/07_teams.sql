-- ============================================================
-- Migration 07: Multi-tenancy — Teams table + team_id columns
-- ============================================================

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Users ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- ── Sprints ──────────────────────────────────────────────────
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- ── Progress Reports ─────────────────────────────────────────
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- ── Weekly Reports ───────────────────────────────────────────
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- ── Emails CRM ───────────────────────────────────────────────
ALTER TABLE emails_crm_smes ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE emails_crm_templates ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- ── Kanban ───────────────────────────────────────────────────
ALTER TABLE kanban_boards ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

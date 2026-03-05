-- =============================================================================
-- SPRINTS & SPRINT TEAM PLANS TABLES
-- Must run before 03_progress_reports.sql (progress_reports references sprints)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sprints (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_number  VARCHAR(50)  NOT NULL UNIQUE,
  color          VARCHAR(7)   NOT NULL,
  created_by     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sprint_team_plans (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id  UUID  NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  team_plan  TEXT  NOT NULL,
  created_by UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sprints_created_by              ON sprints(created_by);
CREATE INDEX IF NOT EXISTS idx_sprint_team_plans_sprint_id     ON sprint_team_plans(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_team_plans_created_by    ON sprint_team_plans(created_by);

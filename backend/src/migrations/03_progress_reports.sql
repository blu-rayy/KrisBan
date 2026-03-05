-- =============================================================================
-- PROGRESS REPORTS TABLE
-- Depends on: 01_users.sql, 02_sprints.sql
-- Incorporates: add_sprint_reference, add_team_plan_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS progress_reports (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE          NOT NULL,
  member_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sprint_no    VARCHAR(20)   NOT NULL,
  sprint_id    UUID          REFERENCES sprints(id) ON DELETE SET NULL,
  team_plan    TEXT          DEFAULT '',
  team_plan_id UUID          REFERENCES sprint_team_plans(id) ON DELETE SET NULL,
  category     VARCHAR(100)  NOT NULL,
  task_done    TEXT          NOT NULL,
  image_url    TEXT,
  created_by   UUID          NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_reports_date         ON progress_reports(date);
CREATE INDEX IF NOT EXISTS idx_progress_reports_member_id    ON progress_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_sprint_no    ON progress_reports(sprint_no);
CREATE INDEX IF NOT EXISTS idx_progress_reports_sprint_id    ON progress_reports(sprint_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_team_plan_id ON progress_reports(team_plan_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_category     ON progress_reports(category);
CREATE INDEX IF NOT EXISTS idx_progress_reports_created_by   ON progress_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_progress_reports_created_at   ON progress_reports(created_at);

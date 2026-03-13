-- =============================================================================
-- Migration 08: Scope weekly report uniqueness by team
-- =============================================================================

-- Drop old global unique constraint on report_week, if it exists.
ALTER TABLE weekly_reports
  DROP CONSTRAINT IF EXISTS weekly_reports_report_week_key;

-- Keep supporting index for report_week filtering.
CREATE INDEX IF NOT EXISTS idx_weekly_reports_report_week ON weekly_reports(report_week);

-- Enforce one row per (team_id, report_week) for team-scoped data.
CREATE UNIQUE INDEX IF NOT EXISTS ux_weekly_reports_team_week
  ON weekly_reports(team_id, report_week)
  WHERE team_id IS NOT NULL;

-- Enforce one row per report_week for legacy/global rows (team_id IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS ux_weekly_reports_null_team_week
  ON weekly_reports(report_week)
  WHERE team_id IS NULL;

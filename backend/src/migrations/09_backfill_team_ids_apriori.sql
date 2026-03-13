-- =============================================================================
-- Migration 09: Backfill team_id values to A Priori (team_id = 1)
-- Context: Existing data was created before/while multi-tenancy rollout.
-- =============================================================================

-- 1) Weekly reports: move legacy++/null records to A Priori.
-- Resolve all duplicates per report_week first, then normalize team_id.
WITH ranked AS (
  SELECT
    wr.id,
    wr.report_week,
    FIRST_VALUE(wr.id) OVER (
      PARTITION BY wr.report_week
      ORDER BY
        CASE
          WHEN wr.team_id = 1 THEN 0
          WHEN wr.team_id = 2 THEN 1
          WHEN wr.team_id IS NULL THEN 2
          ELSE 3
        END,
        wr.created_at ASC,
        wr.id ASC
    ) AS canonical_id,
    ROW_NUMBER() OVER (
      PARTITION BY wr.report_week
      ORDER BY
        CASE
          WHEN wr.team_id = 1 THEN 0
          WHEN wr.team_id = 2 THEN 1
          WHEN wr.team_id IS NULL THEN 2
          ELSE 3
        END,
        wr.created_at ASC,
        wr.id ASC
    ) AS row_rank
  FROM weekly_reports wr
  WHERE wr.team_id = 1 OR wr.team_id = 2 OR wr.team_id IS NULL
),
dupe_pairs AS (
  SELECT
    r.id AS source_id,
    r.canonical_id AS target_id
  FROM ranked r
  WHERE r.row_rank > 1
    AND r.id <> r.canonical_id
),
merged_entries AS (
  INSERT INTO weekly_report_entries (
    weekly_report_id,
    row_number,
    row_date,
    row_activity,
    has_source_entries,
    created_at,
    updated_at
  )
  SELECT
    d.target_id,
    e.row_number,
    e.row_date,
    e.row_activity,
    e.has_source_entries,
    e.created_at,
    e.updated_at
  FROM dupe_pairs d
  JOIN weekly_report_entries e ON e.weekly_report_id = d.source_id
  ON CONFLICT (weekly_report_id, row_number) DO UPDATE
  SET
    row_date = COALESCE(EXCLUDED.row_date, weekly_report_entries.row_date),
    row_activity = CASE
      WHEN COALESCE(weekly_report_entries.row_activity, '') = '' THEN EXCLUDED.row_activity
      ELSE weekly_report_entries.row_activity
    END,
    has_source_entries = weekly_report_entries.has_source_entries OR EXCLUDED.has_source_entries,
    updated_at = NOW()
  RETURNING 1
)
DELETE FROM weekly_reports wr
USING dupe_pairs d
WHERE wr.id = d.source_id;

UPDATE weekly_reports
SET team_id = 1
WHERE team_id IS NULL OR team_id = 2;

-- 2) Sprints: derive from creator when possible, then fallback to team 1.
UPDATE sprints s
SET team_id = u.team_id
FROM users u
WHERE s.team_id IS NULL
  AND s.created_by = u.id
  AND u.team_id IS NOT NULL;

UPDATE sprints
SET team_id = 1
WHERE team_id IS NULL;

-- 3) Progress reports: derive from member/creator team, then fallback to team 1.
UPDATE progress_reports p
SET team_id = COALESCE(
  (SELECT u.team_id FROM users u WHERE u.id = p.member_id),
  (SELECT u.team_id FROM users u WHERE u.id = p.created_by),
  1
)
WHERE p.team_id IS NULL;

UPDATE progress_reports
SET team_id = 1
WHERE team_id IS NULL;

-- 4) Kanban boards: derive from creator team, then fallback to team 1.
UPDATE kanban_boards b
SET team_id = u.team_id
FROM users u
WHERE b.team_id IS NULL
  AND b.created_by = u.id
  AND u.team_id IS NOT NULL;

UPDATE kanban_boards
SET team_id = 1
WHERE team_id IS NULL;

-- 5) Emails CRM templates: derive from creator team, then fallback to team 1.
UPDATE emails_crm_templates t
SET team_id = u.team_id
FROM users u
WHERE t.team_id IS NULL
  AND t.created_by = u.id
  AND u.team_id IS NOT NULL;

UPDATE emails_crm_templates
SET team_id = 1
WHERE team_id IS NULL;

-- 6) Emails CRM SMEs: derive from creator/point-person team, then fallback to team 1.
UPDATE emails_crm_smes s
SET team_id = COALESCE(
  (SELECT u.team_id FROM users u WHERE u.id = s.created_by),
  (SELECT u.team_id FROM users u WHERE u.id = s.point_person_user_id),
  1
)
WHERE s.team_id IS NULL;

UPDATE emails_crm_smes
SET team_id = 1
WHERE team_id IS NULL;

-- Optional sanity checks (run manually):
-- SELECT team_id, count(*) FROM weekly_reports GROUP BY team_id ORDER BY team_id;
-- SELECT team_id, count(*) FROM sprints GROUP BY team_id ORDER BY team_id;
-- SELECT team_id, count(*) FROM progress_reports GROUP BY team_id ORDER BY team_id;
-- SELECT team_id, count(*) FROM kanban_boards GROUP BY team_id ORDER BY team_id;
-- SELECT team_id, count(*) FROM emails_crm_templates GROUP BY team_id ORDER BY team_id;
-- SELECT team_id, count(*) FROM emails_crm_smes GROUP BY team_id ORDER BY team_id;

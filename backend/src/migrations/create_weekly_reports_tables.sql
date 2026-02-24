-- Weekly Reports Tables SQL Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_week INTEGER NOT NULL UNIQUE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  reporting_date TEXT NOT NULL,
  signatory_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weekly_reports_valid_week_range CHECK (week_end_date = (week_start_date + INTERVAL '5 days'))
);

CREATE TABLE IF NOT EXISTS weekly_report_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  row_date DATE,
  row_activity TEXT DEFAULT '',
  has_source_entries BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weekly_report_entries_row_number_range CHECK (row_number >= 1 AND row_number <= 6),
  CONSTRAINT weekly_report_entries_unique_row UNIQUE (weekly_report_id, row_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_report_week ON weekly_reports(report_week);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start_date ON weekly_reports(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_signatory_date ON weekly_reports(signatory_date);
CREATE INDEX IF NOT EXISTS idx_weekly_report_entries_weekly_report_id ON weekly_report_entries(weekly_report_id);
CREATE INDEX IF NOT EXISTS idx_weekly_report_entries_row_date ON weekly_report_entries(row_date);

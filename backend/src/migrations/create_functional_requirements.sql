-- Migration: create functional_requirements table
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS functional_requirements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fr_id       TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  weight      NUMERIC(6,2) NOT NULL DEFAULT 0,
  progress    NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parent_id   UUID        REFERENCES functional_requirements(id) ON DELETE CASCADE,
  order_index INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_parent_id ON functional_requirements(parent_id);
CREATE INDEX IF NOT EXISTS idx_fr_fr_id     ON functional_requirements(fr_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_functional_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fr_updated_at ON functional_requirements;
CREATE TRIGGER trg_fr_updated_at
  BEFORE UPDATE ON functional_requirements
  FOR EACH ROW EXECUTE FUNCTION update_functional_requirements_updated_at();

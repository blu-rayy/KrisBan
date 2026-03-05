-- =============================================================================
-- USERS TABLE
-- Supabase Auth creates the base users table on signup.
-- Run these statements once after your Supabase project is created.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS student_number   VARCHAR(50)  UNIQUE,
  ADD COLUMN IF NOT EXISTS username         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS full_name        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birthday         DATE,
  ADD COLUMN IF NOT EXISTS institute_email  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS personal_email   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signature        TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture  TEXT;

-- student_number is the primary user identifier; email is optional
ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

-- Remove legacy name column if it was created before the rename
ALTER TABLE users
  DROP COLUMN IF EXISTS name CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

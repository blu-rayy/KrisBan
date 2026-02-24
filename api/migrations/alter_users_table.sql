-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS student_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS username VARCHAR(100),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS institute_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS signature TEXT;

-- Make email nullable since we're using student_number as primary identifier
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Drop old name column if it exists (we'll use full_name instead)
ALTER TABLE users
DROP COLUMN IF EXISTS name CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

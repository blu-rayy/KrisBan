-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_number VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create sprint_team_plans table
CREATE TABLE IF NOT EXISTS sprint_team_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL,
  team_plan TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sprints_created_by ON sprints(created_by);
CREATE INDEX IF NOT EXISTS idx_sprint_team_plans_sprint_id ON sprint_team_plans(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_team_plans_created_by ON sprint_team_plans(created_by);

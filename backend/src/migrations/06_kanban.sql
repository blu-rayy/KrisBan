-- ============================================================
-- 06_kanban.sql  –  Kanban board system
-- Run once in Supabase SQL editor
-- ============================================================

-- Boards
CREATE TABLE IF NOT EXISTS kanban_boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   FLOAT8 NOT NULL DEFAULT 0,
  color      TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS kanban_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  column_id   UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  position    FLOAT8 NOT NULL DEFAULT 0,
  due_date    DATE,
  cover_color TEXT,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  tasks_total INT NOT NULL DEFAULT 0,
  tasks_done  INT NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Labels (per-board)
CREATE TABLE IF NOT EXISTS kanban_labels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket ↔ Label (junction)
CREATE TABLE IF NOT EXISTS kanban_ticket_labels (
  ticket_id UUID NOT NULL REFERENCES kanban_tickets(id) ON DELETE CASCADE,
  label_id  UUID NOT NULL REFERENCES kanban_labels(id)  ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, label_id)
);

-- Ticket assignees (junction)
CREATE TABLE IF NOT EXISTS kanban_ticket_assignees (
  ticket_id UUID NOT NULL REFERENCES kanban_tickets(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, user_id)
);

-- Checklist items
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES kanban_tickets(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  position   FLOAT8 NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachments / links
CREATE TABLE IF NOT EXISTS kanban_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES kanban_tickets(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  is_link    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS kanban_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES kanban_tickets(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board        ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tickets_board        ON kanban_tickets(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tickets_column       ON kanban_tickets(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tickets_archive      ON kanban_tickets(archived, archived_at);
CREATE INDEX IF NOT EXISTS idx_kanban_tickets_due          ON kanban_tickets(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_ticket         ON kanban_tasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kanban_attachments_ticket   ON kanban_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_ticket      ON kanban_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kanban_assignees_user       ON kanban_ticket_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_ticket_labels_ticket ON kanban_ticket_labels(ticket_id);

-- ── Realtime (stream full row changes) ────────────────────────────────────────
ALTER TABLE kanban_tickets REPLICA IDENTITY FULL;
ALTER TABLE kanban_columns REPLICA IDENTITY FULL;

-- ── Seed: default board ───────────────────────────────────────────────────────
DO $$
DECLARE
  bid UUID;
BEGIN
  -- Only seed if no boards exist
  IF NOT EXISTS (SELECT 1 FROM kanban_boards LIMIT 1) THEN
    INSERT INTO kanban_boards (name, description)
    VALUES ('2nd Semester', 'Main project board for the second semester')
    RETURNING id INTO bid;

    INSERT INTO kanban_columns (board_id, name, position, color) VALUES
      (bid, 'To Do',     1000, '#6B7280'),
      (bid, 'To Review', 2000, '#F59E0B'),
      (bid, 'Done',      3000, '#10B981');
  END IF;
END $$;

-- ── Archive cleanup function (call daily via pg_cron) ─────────────────────────
-- SELECT cron.schedule('cleanup-kanban-archive', '0 3 * * *',
--   $$DELETE FROM kanban_tickets WHERE archived = TRUE AND archived_at < NOW() - INTERVAL '3 days'$$);

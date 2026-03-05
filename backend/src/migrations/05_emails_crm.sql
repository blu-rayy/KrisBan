-- =============================================================================
-- EMAILS CRM TABLES
-- Depends on: 01_users.sql
-- Incorporates: add_contact_fields_to_smes, create_sme_conversation_logs,
--               add_messages_to_sme_logs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SMEs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emails_crm_smes (
  id                        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT  NOT NULL,
  title                     TEXT  NOT NULL,
  organization              TEXT  NOT NULL,
  profile_picture           TEXT,
  summary                   TEXT,
  email                     TEXT,
  phone                     TEXT,
  linkedin_url              TEXT,
  point_person_user_id      UUID,
  point_person_name_snapshot TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Sent', 'Waiting', 'Responded', 'No Reply')),
  last_contact_date         DATE,
  notes                     TEXT,
  created_by                UUID,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (point_person_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)           REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Email Templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emails_crm_templates (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT  NOT NULL,
  content       TEXT  NOT NULL,
  created_by    UUID,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- SME Conversation Logs
-- messages: ordered array of { direction: 'sent'|'received', content: TEXT }
-- sent_message / response kept for backward compat with old rows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emails_crm_sme_logs (
  id           UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id       UUID   NOT NULL REFERENCES emails_crm_smes(id) ON DELETE CASCADE,
  log_date     DATE,
  messages     JSONB,
  sent_message TEXT,
  response     TEXT,
  template_id  UUID   REFERENCES emails_crm_templates(id) ON DELETE SET NULL,
  created_by   UUID   REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_emails_crm_smes_status                ON emails_crm_smes(status);
CREATE INDEX IF NOT EXISTS idx_emails_crm_smes_point_person_user_id  ON emails_crm_smes(point_person_user_id);
CREATE INDEX IF NOT EXISTS idx_emails_crm_smes_point_person_name     ON emails_crm_smes(point_person_name_snapshot);
CREATE INDEX IF NOT EXISTS idx_emails_crm_templates_name             ON emails_crm_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_emails_crm_sme_logs_sme_id            ON emails_crm_sme_logs(sme_id);
CREATE INDEX IF NOT EXISTS idx_emails_crm_sme_logs_log_date          ON emails_crm_sme_logs(log_date);

-- ---------------------------------------------------------------------------
-- Seed Data (only inserts if tables are empty)
-- ---------------------------------------------------------------------------
INSERT INTO emails_crm_smes (
  name, title, organization,
  point_person_user_id, point_person_name_snapshot,
  status, last_contact_date, notes
)
SELECT *
FROM (VALUES
  ('Dr. Liza Fernandes',  'Senior Public Health Analyst', 'Cebu City Health Office', NULL::uuid, 'Kristian', 'Draft',     '2026-02-25'::date, 'Open to interviews on Tuesdays, prefers email first.'),
  ('Engr. Paolo Mendoza', 'GIS Program Lead',             'Metro Data Lab',           NULL::uuid, 'Marianne', 'Waiting',   '2026-02-27'::date, 'Requested a one-page research brief before sharing data scope.'),
  ('Atty. Bea Soliven',   'Policy Advisor',               'Open Governance PH',       NULL::uuid, 'Angel',    'Responded', '2026-03-01'::date, 'Available for a 30-minute call next week.'),
  ('Prof. Ramon Cruz',    'Data Ethics Researcher',       'UP School of Statistics',  NULL::uuid, 'Michael',  'No Reply',  '2026-02-18'::date, 'Follow-up needed if no response by end of week.')
) AS seed(name, title, organization, point_person_user_id, point_person_name_snapshot, status, last_contact_date, notes)
WHERE NOT EXISTS (SELECT 1 FROM emails_crm_smes);

INSERT INTO emails_crm_templates (template_name, content)
SELECT *
FROM (VALUES
  ('Initial Interview Request',
   E'Hi [SME_NAME],\n\nI hope you are doing well. My name is [SENDER_NAME], and I am part of the KrisBan research team. We would like to request a short interview regarding your work at [ORGANIZATION].\n\nYour perspective as [SME_TITLE] would greatly help our study.\n\nBest regards,\n[SENDER_NAME]'),
  ('Data Access Request',
   E'Hello [SME_NAME],\n\nThis is [SENDER_NAME] from KrisBan. We are currently compiling project references and would like to request publicly shareable datasets or documentation from [ORGANIZATION].\n\nWe last reached out on [LAST_CONTACT_DATE] and would appreciate any update when convenient.\n\nThank you,\n[SENDER_NAME]'),
  ('Follow-up Outreach',
   E'Hi [SME_NAME],\n\nI am following up on my previous message regarding our interview/data request with [ORGANIZATION].\n\nIf easier, we can adjust the scope or timing based on your availability.\n\nThanks again,\n[SENDER_NAME]')
) AS seed(template_name, content)
WHERE NOT EXISTS (SELECT 1 FROM emails_crm_templates);

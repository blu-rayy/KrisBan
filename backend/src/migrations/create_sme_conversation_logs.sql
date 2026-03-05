-- SME Conversation Logs: record sent messages and received responses per SME

CREATE TABLE IF NOT EXISTS emails_crm_sme_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL,
  log_date DATE,
  sent_message TEXT,
  response TEXT,
  template_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sme_id) REFERENCES emails_crm_smes(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES emails_crm_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_crm_sme_logs_sme_id ON emails_crm_sme_logs(sme_id);
CREATE INDEX IF NOT EXISTS idx_emails_crm_sme_logs_log_date ON emails_crm_sme_logs(log_date);

-- Add messages JSONB column to sme_logs for multi-message thread support
-- Each entry is an array of { direction: 'sent'|'received', content: TEXT }
-- Backward-compat: old rows using sent_message/response are still supported

ALTER TABLE emails_crm_sme_logs
  ADD COLUMN IF NOT EXISTS messages JSONB;

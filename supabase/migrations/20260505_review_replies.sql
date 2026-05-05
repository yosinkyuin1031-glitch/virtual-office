-- AIオフィス Phase1: 口コミ返信機能
-- meo_clinic_reviews に返信トラッキング列を追加

ALTER TABLE meo_clinic_reviews
  ADD COLUMN IF NOT EXISTS ai_reply_draft TEXT,
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS reply_status TEXT DEFAULT 'unreplied' CHECK (reply_status IN ('unreplied','draft','approved','posted','skipped')),
  ADD COLUMN IF NOT EXISTS reply_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS llmo_keywords JSONB,
  ADD COLUMN IF NOT EXISTS owner_note TEXT;

CREATE INDEX IF NOT EXISTS idx_meo_reviews_status ON meo_clinic_reviews(clinic_id, reply_status);

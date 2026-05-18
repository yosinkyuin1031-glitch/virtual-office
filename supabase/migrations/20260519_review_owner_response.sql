-- AIオフィス: Google側のオーナー返信を取り込んで「未応答」を正しく判定する
ALTER TABLE meo_clinic_reviews
  ADD COLUMN IF NOT EXISTS review_id_external TEXT,
  ADD COLUMN IF NOT EXISTS owner_response_text TEXT,
  ADD COLUMN IF NOT EXISTS owner_response_date TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_meo_reviews_owner_response
  ON meo_clinic_reviews(clinic_id, owner_response_text);

CREATE INDEX IF NOT EXISTS idx_meo_reviews_review_id_external
  ON meo_clinic_reviews(clinic_id, review_id_external);

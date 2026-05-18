-- 口コミの実投稿日（ISO）を保持し、新着順に並べ替え可能にする
ALTER TABLE meo_clinic_reviews
  ADD COLUMN IF NOT EXISTS review_iso_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_meo_reviews_iso_date
  ON meo_clinic_reviews(clinic_id, review_iso_date DESC);

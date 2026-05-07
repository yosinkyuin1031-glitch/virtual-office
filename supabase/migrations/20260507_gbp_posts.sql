-- GBP毎日投稿機能：投稿テンプレ・動画プール・日次投稿
CREATE TABLE IF NOT EXISTS office_gbp_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gbp_videos_clinic ON office_gbp_videos(clinic_id, active);

CREATE TABLE IF NOT EXISTS office_gbp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  post_text TEXT NOT NULL,
  keyword TEXT,
  video_url TEXT,
  video_title TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','posted','skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  UNIQUE(clinic_id, scheduled_date)
);
CREATE INDEX IF NOT EXISTS idx_gbp_posts_date ON office_gbp_posts(clinic_id, scheduled_date DESC);

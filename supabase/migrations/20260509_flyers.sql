-- チラシ整理：チラシデータをSupabaseで管理（端末跨ぎ・破損防止）
CREATE TABLE IF NOT EXISTS office_flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'seitai',
  title TEXT NOT NULL DEFAULT '無題のチラシ',
  data JSONB NOT NULL,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flyers_biz ON office_flyers(business_id, archived, updated_at DESC);

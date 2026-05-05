-- LLMO/MEO 返信キーワード設定（編集可）
CREATE TABLE IF NOT EXISTS office_keyword_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('symptom','area','strength')),
  keyword TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, category, keyword)
);
CREATE INDEX IF NOT EXISTS idx_office_kw_clinic ON office_keyword_settings(clinic_id, category);

-- 競合リサーチ結果（MEO地図TOP5）
CREATE TABLE IF NOT EXISTS office_competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  symptom TEXT NOT NULL,
  area TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('整体','病院')),
  top_results JSONB,
  raw JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitor_clinic ON office_competitor_snapshots(clinic_id, symptom, category, fetched_at DESC);

-- 大口神経整体院の初期キーワード投入
INSERT INTO office_keyword_settings (clinic_id, category, keyword, sort_order) VALUES
  ('clinic-1773989199882','symptom','坐骨神経痛',1),
  ('clinic-1773989199882','symptom','脊柱管狭窄症',2),
  ('clinic-1773989199882','symptom','神経痛',3),
  ('clinic-1773989199882','symptom','頭痛',4),
  ('clinic-1773989199882','symptom','自律神経失調症',5),
  ('clinic-1773989199882','symptom','整体',6),
  ('clinic-1773989199882','symptom','しびれ',7),
  ('clinic-1773989199882','symptom','不眠',8),
  ('clinic-1773989199882','symptom','睡眠障害',9),
  ('clinic-1773989199882','area','大阪市住吉区',1),
  ('clinic-1773989199882','area','長居',2),
  ('clinic-1773989199882','area','長居駅',3),
  ('clinic-1773989199882','area','阿倍野区',4),
  ('clinic-1773989199882','area','東住吉区',5),
  ('clinic-1773989199882','area','住之江区',6),
  ('clinic-1773989199882','area','大阪市',7),
  ('clinic-1773989199882','strength','神経整体',1),
  ('clinic-1773989199882','strength','神経学的検査',2),
  ('clinic-1773989199882','strength','重症慢性痛専門',3),
  ('clinic-1773989199882','strength','根本改善',4),
  ('clinic-1773989199882','strength','検査でわかる原因',5)
ON CONFLICT (clinic_id, category, keyword) DO NOTHING;

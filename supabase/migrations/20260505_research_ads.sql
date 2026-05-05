-- AIオフィス Phase3: 広告リサーチ結果保存
CREATE TABLE IF NOT EXISTS meo_ad_research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  query TEXT NOT NULL,
  area TEXT,
  raw_results JSONB,
  ad_count INTEGER DEFAULT 0,
  organic_top JSONB,
  ads JSONB,
  related_questions JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_research_clinic ON meo_ad_research_reports(clinic_id, created_at DESC);

-- AIオフィス Phase4: 広告分析（Meta/Google Ads）日次スナップショット
CREATE TABLE IF NOT EXISTS office_ad_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta','google')),
  account_id TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  ctr NUMERIC(6,4),
  cpc NUMERIC(10,2),
  cpa NUMERIC(10,2),
  raw JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_metrics_unique ON office_ad_metrics_daily(clinic_id, platform, campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON office_ad_metrics_daily(clinic_id, platform, date DESC);

CREATE TABLE IF NOT EXISTS office_ad_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta','google')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','connected','error')),
  account_id TEXT,
  developer_token TEXT,
  access_token TEXT,
  refresh_token TEXT,
  customer_id TEXT,
  manager_id TEXT,
  expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, platform)
);

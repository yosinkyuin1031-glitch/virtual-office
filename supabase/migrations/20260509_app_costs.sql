-- 外部アプリの月額コスト管理
CREATE TABLE IF NOT EXISTS office_app_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,            -- products.id 互換
  app_name TEXT NOT NULL,
  month TEXT NOT NULL,             -- YYYY-MM
  vercel_jpy NUMERIC(10,0) DEFAULT 0,
  supabase_jpy NUMERIC(10,0) DEFAULT 0,
  api_anthropic_jpy NUMERIC(10,0) DEFAULT 0,
  api_other_jpy NUMERIC(10,0) DEFAULT 0,
  domain_jpy NUMERIC(10,0) DEFAULT 0,
  other_jpy NUMERIC(10,0) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_id, month)
);
CREATE INDEX IF NOT EXISTS idx_app_costs_month ON office_app_costs(month, app_id);

-- 計算列：合計を view で
CREATE OR REPLACE VIEW office_app_costs_with_total AS
SELECT
  *,
  (vercel_jpy + supabase_jpy + api_anthropic_jpy + api_other_jpy + domain_jpy + other_jpy) AS total_jpy
FROM office_app_costs;

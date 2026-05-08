-- ナレッジ・コンテキスト・承認待ちインポート
CREATE TABLE IF NOT EXISTS office_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  source TEXT DEFAULT 'manual',
  source_ref TEXT,
  active BOOLEAN DEFAULT true,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_biz_cat ON office_knowledge(business_id, category, active);

CREATE TABLE IF NOT EXISTS office_context_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  effective_until DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','archived')),
  source TEXT DEFAULT 'manual',
  source_ref TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_context_biz_cat ON office_context_items(business_id, category, status);

-- 承認待ちインポート（Plaud / メモリインポート / 手動 共通）
CREATE TABLE IF NOT EXISTS office_pending_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,             -- 'plaud' | 'memory_import' | 'manual'
  source_ref TEXT,                   -- 録音ID/ファイル名等
  raw_content TEXT NOT NULL,         -- 文字起こし全文
  ai_classification JSONB,           -- {type, business_id, category, title, content_proposal, reasoning}
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','archived')),
  reviewed_at TIMESTAMPTZ,
  reviewed_note TEXT,
  result_id UUID,                    -- 承認後に作成された office_knowledge / office_context_items の ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_imports_status ON office_pending_imports(status, created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- company_context: chairman_memos を昇格させた会社コンテキスト
-- 2026-04-12
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- AI社員が全員参照できる会社情報の蓄積場所。
-- LINE/Proud 経由で入った大口さんのメモ（方針・気づき）のうち、
-- 会社情報として残すべきものをここに昇格する。
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS company_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'direction',      -- 方針・戦略
    'insight',        -- 気づき・学び
    'rule',           -- 会社ルール
    'hearing',        -- ヒアリング記録
    'market',         -- 市場・競合情報
    'member_voice',   -- メンバー・患者の声
    'other'
  )),
  department_tags TEXT[] DEFAULT '{}',
  business_tags TEXT[] DEFAULT '{}',  -- ['seitai','houmon','app_sales','device','consulting']
  source TEXT NOT NULL DEFAULT 'promoted',  -- 'promoted' | 'manual' | 'proud'
  source_memo_id UUID REFERENCES chairman_memos(id) ON DELETE SET NULL,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_context_category ON company_context (category);
CREATE INDEX IF NOT EXISTS idx_company_context_promoted_at ON company_context (promoted_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_context_dept ON company_context USING GIN (department_tags);
CREATE INDEX IF NOT EXISTS idx_company_context_business ON company_context USING GIN (business_tags);

-- chairman_memos に promoted_to_context フラグ追加（昇格済みかを追跡）
ALTER TABLE chairman_memos
  ADD COLUMN IF NOT EXISTS promoted_to_context BOOLEAN NOT NULL DEFAULT false;

-- chairman_memos に source 種別を拡張（Proud対応）
-- 既存カラム source は TEXT なのでそのまま 'line' | 'proud' | 'manual' で運用

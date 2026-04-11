-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- vo_tasks: assignee_type / priority_locked 追加
-- 2026-04-12
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- assignee_type:
--   'cc'      = CC（Claude Code）側で自動実行するタスク
--   'ooguchi' = 大口さんが確認・判断するタスク
--   'both'    = 両方必要（CCが下準備→大口さん判断）
--
-- priority_locked:
--   true のとき AI 側の優先度自動調整から除外
--   LINE で手動設定した場合に true になる
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE vo_tasks
  ADD COLUMN IF NOT EXISTS assignee_type TEXT NOT NULL DEFAULT 'cc'
    CHECK (assignee_type IN ('cc', 'ooguchi', 'both'));

ALTER TABLE vo_tasks
  ADD COLUMN IF NOT EXISTS priority_locked BOOLEAN NOT NULL DEFAULT false;

-- 既存タスクのデフォルト割り当て:
-- 経営層・財務部のタスクは大口さんが判断するものが多いので 'ooguchi'
UPDATE vo_tasks
SET assignee_type = 'ooguchi'
WHERE department IN ('経営層', '財務部')
  AND assignee_type = 'cc';

-- インデックス（LINE 表示で assignee_type + status で引くため）
CREATE INDEX IF NOT EXISTS idx_vo_tasks_assignee_status
  ON vo_tasks (assignee_type, status, due_date);

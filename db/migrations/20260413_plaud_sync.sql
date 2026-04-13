-- Plaud同期済みファイル管理テーブル
CREATE TABLE IF NOT EXISTS plaud_synced_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id TEXT UNIQUE NOT NULL,
  file_name TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  memo_id UUID REFERENCES chairman_memos(id),
  content_preview TEXT
);

-- インデックス: drive_file_idの検索高速化
CREATE INDEX IF NOT EXISTS idx_plaud_synced_files_drive_file_id
  ON plaud_synced_files(drive_file_id);

-- インデックス: 処理日時順の取得用
CREATE INDEX IF NOT EXISTS idx_plaud_synced_files_processed_at
  ON plaud_synced_files(processed_at DESC);

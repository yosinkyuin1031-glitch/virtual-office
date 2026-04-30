-- 患者発言DB（vo_patient_voices）
-- 全AI生成物の素材になる「現場の言葉」を集約するテーブル
-- ソース: 大口問診 / Plaud音声 / Google口コみ / インタビュー / 手動入力

create table if not exists vo_patient_voices (
  id uuid primary key default gen_random_uuid(),

  -- ソース情報
  source text not null check (source in ('monshin', 'plaud', 'review', 'interview', 'manual', 'other')),
  source_ref text,                       -- 元データID（問診ID、PlaudセッションID、口コみURL等）

  -- 患者情報（任意）
  patient_id text,                       -- 紐付け用
  patient_name text,                     -- 表示用（個人情報注意）
  age_range text,                        -- '20代'|'30代'|...|'80代以上'
  gender text,                           -- 'M'|'F'|'other'

  -- 発言本体
  raw_text text not null,                -- 患者が実際に発した言葉（生）
  normalized_quote text,                 -- AI正規化後の引用形（例：「肩がガッチガチでしんどい」）

  -- カテゴリ（複数可）
  symptom_tags text[] default '{}',      -- ['肩こり','腰痛','痺れ','頭痛','不眠']
  emotion_tags text[] default '{}',      -- ['不安','痛み','絶望','希望','安心']
  scene_tags text[] default '{}',        -- ['夜中','仕事中','起床時','育児中','スポーツ中']

  -- 治療フェーズ
  session_number int,                    -- 1=初診, 2=2回目, ...
  repeat_status text check (repeat_status in ('new', 'repeating', 'churned', 'completed', 'unknown')) default 'unknown',

  -- 事業
  business_unit text default '大口神経整体院',  -- '大口神経整体院'|'晴陽鍼灸院'

  -- メタ
  captured_at timestamptz,               -- 患者が言ったタイミング（取得元から）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text default 'manual',      -- 'manual' | 'fumi' | 'ai-extract' 等

  -- 利用状況（AIが何回素材として使ったか）
  used_count int not null default 0,
  last_used_at timestamptz
);

-- インデックス
create index if not exists vo_patient_voices_source_idx on vo_patient_voices (source);
create index if not exists vo_patient_voices_business_idx on vo_patient_voices (business_unit);
create index if not exists vo_patient_voices_repeat_idx on vo_patient_voices (repeat_status);
create index if not exists vo_patient_voices_captured_idx on vo_patient_voices (captured_at desc);
create index if not exists vo_patient_voices_symptom_idx on vo_patient_voices using gin (symptom_tags);
create index if not exists vo_patient_voices_emotion_idx on vo_patient_voices using gin (emotion_tags);

-- updated_at自動更新トリガー
create or replace function vo_patient_voices_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists vo_patient_voices_updated_at_trigger on vo_patient_voices;
create trigger vo_patient_voices_updated_at_trigger
  before update on vo_patient_voices
  for each row
  execute function vo_patient_voices_updated_at();

-- RLS（Service Role経由で読み書きするため、公開アクセスは無効）
alter table vo_patient_voices enable row level security;

-- サンプル: 動作確認用のシード（後で削除可）
insert into vo_patient_voices (source, raw_text, normalized_quote, symptom_tags, emotion_tags, scene_tags, repeat_status, created_by) values
  ('manual', '夜中に痺れで目が覚めるんです', '夜中に痺れで目が覚める', '{"痺れ","睡眠障害"}', '{"不安","睡眠不足"}', '{"夜中"}', 'repeating', 'manual'),
  ('manual', '肩ガッチガチでしんどんやわ', '肩ガッチガチでしんどい', '{"肩こり"}', '{"疲労感"}', '{"日常"}', 'new', 'manual'),
  ('manual', '他の整体院で良くならなかったから来ました', '他の整体院で良くならなかった', '{"重症"}', '{"絶望","期待"}', '{"院選び"}', 'new', 'manual')
on conflict do nothing;

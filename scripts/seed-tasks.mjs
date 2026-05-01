// 即時タスク投入スクリプト
// 事業ルールで autoExecuteTasks=true の事業のタスクを vo_tasks に投入
import pg from 'pg'

const url = process.env.SUPABASE_DB_URL ||
  'postgresql://postgres.vzkfkazjylrkspqrnhnx:fJZj8SDawfJze7H9@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'

const today = new Date().toISOString().slice(0, 10)

const tasks = [
  {
    department: 'メディア部',
    employee_name: 'ルナ',
    title: '月光ヒーリング再生・登録者を伸ばすリサーチ',
    description: `月光ヒーリングYouTubeチャンネルを伸ばすためのリサーチ。

【調査範囲】
1. 睡眠/瞑想/作業BGM/自律神経系で登録者10万人以上のチャンネルTOP15を特定
2. 各チャンネルの分析：
   - 動画の尺（10分/1時間/3時間/8時間）の傾向
   - タイトル構造（数字・周波数・色・効能訴求の使い方）
   - サムネ傾向（文字あり/なし、月/星/水/森/夜空 等のモチーフ）
   - 投稿頻度（毎日/週2/週1）
   - 投稿時間帯
   - ライブ配信の有無と頻度
3. 高再生回数の動画TOP30の共通要素
4. 月光ヒーリングが取れていないニッチキーワード5つ

【アウトプット】
プレーンテキストで以下の構成で書く：
- 競合TOP15のテーブル形式まとめ
- 勝ちパターンの抽出（5つ）
- 月光ヒーリングが今すぐ取り組める打ち手3つ
- 撤退/参入を判断する数値基準

参考にできるチャンネルが特にないとのことなので、ジャンル全体を俯瞰して「再生数・登録者数を伸ばすには何が必要か」のフレーム化を優先。`,
    priority: 'high',
    status: 'pending',
    due_date: today,
    generated_by: 'user_directive',
    batch_id: 'directive_2026-05-01',
  },
  {
    department: 'LP・Web制作部',
    employee_name: 'フミ',
    title: '神経痛診断シート初版（整体院LINE登録特典）',
    description: `大口神経整体院のLINE友達追加のフックになる「診断シート」初版を作成。

【目的】
LP/HPからLINE登録 → 診断シート（自動応答）→ 解説動画 → 初回特典で来院誘導の最初のピース。

【ターゲット】
重症慢性痛・神経痛・他の整体院や病院で原因がわからなかった人。

【含める内容】
1. 設問15-20問（YES/NOまたは3択）
   - 痛み・痺れの種類と部位
   - 症状の継続期間
   - 過去の医療受診歴・整体歴
   - 日常生活での支障度
   - 寝起き・夜間の症状（現場の声DBから「夜中に痺れで目が覚める」等を反映）
2. 結果分類4-5タイプ
   - タイプ別に「考えられる原因」と「次のステップ」を提示
3. 各タイプ末尾に「神経整体での3ステップ施術（リセット→プラス→機能性）」での改善見立て
4. 初回特典への誘導文（特典の種類は陽平さんが後で決めるので「【初回特典名】」のプレースホルダで）

【守ること】
- 患者の声DBの言葉を必ず引用（「ガッチガチ」「夜中に目が覚める」等の生っぽい表現）
- 機能的価値（結果）と情緒的価値（感情）を両方含める
- 医療診断・確定的な病名は避ける（リスクヘッジ）
- AIっぽい綺麗な構成にしない・人間の揺れを入れる

【アウトプット】
- 設問本文（YES/NO選択肢付き）
- 結果分類4-5タイプの本文
- LINE自動応答用のメッセージブロック構成案`,
    priority: 'high',
    status: 'pending',
    due_date: today,
    generated_by: 'user_directive',
    batch_id: 'directive_2026-05-01',
  },
]

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

let inserted = 0
for (const t of tasks) {
  const r = await client.query(
    `insert into vo_tasks (department, employee_name, title, description, priority, status, due_date, generated_by, batch_id, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now()) returning id`,
    [t.department, t.employee_name, t.title, t.description, t.priority, t.status, t.due_date, t.generated_by, t.batch_id],
  )
  console.log(`[seed] inserted: ${t.title} → id=${r.rows[0].id}`)
  inserted++
}
console.log(`[seed] ${inserted} tasks inserted`)
await client.end()

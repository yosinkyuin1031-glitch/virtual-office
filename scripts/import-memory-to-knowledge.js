// 既存メモリファイルを office_knowledge / office_context_items へインポート
// 実行: node scripts/import-memory-to-knowledge.js

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const MEMORY_DIR = '/Users/ooguchiyouhei/.claude/projects/-Users-ooguchiyouhei/memory'
const PG_URL = 'postgresql://postgres.vzkfkazjylrkspqrnhnx:fJZj8SDawfJze7H9@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres'

// マニフェスト：ファイル名 → { type, business_id, category, title, tags }
// type: 'knowledge' | 'context'
const MANIFEST = [
  // ━━━ 大口陽平 個人プロフィール（knowledge: identity）━━━
  { file: 'user_role.md', type: 'knowledge', business_id: 'all', category: 'identity', title: 'ユーザープロフィール（基本）', tags: ['大口陽平', '会長'] },
  { file: 'user_profile_detail.md', type: 'knowledge', business_id: 'all', category: 'identity', title: '大口陽平 詳細プロフィール', tags: ['大口陽平', '性格', 'ビジョン'] },
  { file: 'user_personal_story.md', type: 'knowledge', business_id: 'all', category: 'identity', title: '治療家の原点・開業ストーリー', tags: ['大口陽平', 'ストーリー', '原点'] },
  { file: 'user_mindset_motivation.md', type: 'knowledge', business_id: 'all', category: 'identity', title: 'マインドセット・行動指針・座右の銘', tags: ['マインド', '行動指針'] },
  { file: 'user_corporate_vision.md', type: 'knowledge', business_id: 'all', category: 'identity', title: '法人化ビジョン・ミッション・バリュー', tags: ['ビジョン', '法人化'] },

  // ━━━ 整体院 ━━━
  { file: 'project_clinic_identity.md', type: 'knowledge', business_id: 'seitai', category: 'identity', title: '院の立ち位置・理念・強み・顧客満足度5原則', tags: ['整体院', '理念'] },
  { file: 'reference_proposal_prompt.md', type: 'knowledge', business_id: 'seitai', category: 'method', title: '施術提案書テンプレート（神経整体の哲学・リスク5項目）', tags: ['施術', '提案'] },
  { file: 'reference_neuro_assessment.md', type: 'knowledge', business_id: 'seitai', category: 'method', title: '神経学的検査3ステップ（反射・感覚・筋力）', tags: ['検査', '神経'] },
  { file: 'project_seitai_treatment_framework.md', type: 'knowledge', business_id: 'seitai', category: 'method', title: '神経整体3ステップ（リセット/プラス/機能性）+LTVフォロー', tags: ['治療', 'LTV'] },
  { file: 'reference_quarterly_symptoms.md', type: 'knowledge', business_id: 'seitai', category: 'symptom', title: '四半期別症状訴求リスト', tags: ['症状', 'マーケティング'] },
  { file: 'reference_symptom_pages.md', type: 'knowledge', business_id: 'seitai', category: 'symptom', title: '全95症状リスト＋自律神経系23症状の説明文テンプレ', tags: ['症状', '記事'] },
  { file: 'reference_menu_products.md', type: 'knowledge', business_id: 'seitai', category: 'product', title: 'メニュー・サブスク・物販サプリ（仕入値/販売値）', tags: ['メニュー', '物販'] },
  { file: 'reference_sleep_products.md', type: 'knowledge', business_id: 'seitai', category: 'product', title: '睡眠物販（メラルーカ・サプリ・ウェア・マットレス）', tags: ['睡眠', '物販'] },
  { file: 'project_crosssell_packages.md', type: 'knowledge', business_id: 'seitai', category: 'method', title: '高額商品クロスセル4パターン', tags: ['クロスセル', '高額'] },
  { file: 'project_marketing_philosophy.md', type: 'knowledge', business_id: 'all', category: 'identity', title: 'マーケ哲学（アウトフロー/独占/LTV）', tags: ['マーケ', '哲学'] },
  { file: 'reference_lp_examples.md', type: 'knowledge', business_id: 'seitai', category: 'reference', title: 'LP・広告・HP参考リンク集', tags: ['LP', '参考'] },

  // ━━━ SNS・URL ━━━
  { file: 'reference_sns_urls.md', type: 'knowledge', business_id: 'all', category: 'sns', title: '両院の公式HP/LINE/SNS URL一覧', tags: ['SNS', 'URL', '連絡先'] },
  { file: 'project_youtube_channels.md', type: 'knowledge', business_id: 'all', category: 'sns', title: 'YouTube全4チャンネル管理情報', tags: ['YouTube', 'アカウント'] },

  // ━━━ KPI・目標（context）━━━
  { file: 'project_kpi_seitai.md', type: 'context', business_id: 'seitai', category: 'kpi', title: '整体院 目標・KPI・売上実績', tags: ['KPI', '売上'] },
  { file: 'project_kpi_houmon.md', type: 'context', business_id: 'houmon', category: 'kpi', title: '訪問鍼灸 売上目標・スタッフ計画', tags: ['KPI', '売上'] },
  { file: 'project_kpi_btob.md', type: 'context', business_id: 'app-biz', category: 'kpi', title: 'BtoB SaaS 目標・料金・差別化', tags: ['KPI', 'BtoB'] },
  { file: 'project_kpi_vision.md', type: 'context', business_id: 'all', category: 'kpi', title: '事業全体 中長期年商目標', tags: ['KPI', '長期'] },
  { file: 'project_5year_business_plan.md', type: 'context', business_id: 'all', category: 'kpi', title: '5年事業計画（31〜35歳）', tags: ['KPI', '5年計画'] },
  { file: 'project_5business_foundation.md', type: 'context', business_id: 'all', category: 'priority', title: '5事業の土台設計（一言定義・優先順）', tags: ['事業設計'] },
  { file: 'project_next_priorities.md', type: 'context', business_id: 'all', category: 'priority', title: '次フェーズ優先事項', tags: ['優先事項'] },
  { file: 'project_aioffice_strategy_2026_04_30.md', type: 'context', business_id: 'all', category: 'priority', title: 'AIオフィス事業別運用方針', tags: ['AIオフィス', '方針'] },
  { file: 'project_consulting_history.md', type: 'context', business_id: 'all', category: 'priority', title: '個別コンサル履歴サマリー', tags: ['コンサル'] },
  { file: 'project_seitai_level3_plan.md', type: 'context', business_id: 'seitai', category: 'priority', title: '整体院レベル3実施計画', tags: ['整体院', '計画'] },
  { file: 'project_houmon_level3_plan.md', type: 'context', business_id: 'houmon', category: 'priority', title: '訪問鍼灸レベル3実施計画', tags: ['訪問鍼灸', '計画'] },
  { file: 'project_app_sales_level3_plan.md', type: 'context', business_id: 'app-biz', category: 'priority', title: 'アプリ販売レベル3実施計画', tags: ['アプリ', '計画'] },
  { file: 'project_consulting_level3_plan.md', type: 'context', business_id: 'consulting', category: 'priority', title: 'コンサル事業レベル3実施計画', tags: ['コンサル', '計画'] },
  { file: 'project_device_sales_level3_plan.md', type: 'context', business_id: 'device', category: 'priority', title: '治療機器販売レベル3実施計画', tags: ['機器販売', '計画'] },
  { file: 'project_monthly_campaigns.md', type: 'context', business_id: 'seitai', category: 'campaign', title: '月別キャンペーン年間計画（12ヶ月分）', tags: ['キャンペーン'] },
  { file: 'project_clinic_core_sales.md', type: 'context', business_id: 'app-biz', category: 'priority', title: 'Clinic Core販売動線・料金・モニター枠', tags: ['ClinicCore', 'BtoB'] },

  // ━━━ 訪問鍼灸 ━━━
  { file: 'project_houmon_shinkyu.md', type: 'knowledge', business_id: 'houmon', category: 'identity', title: '訪問鍼灸事業の現状・管理体制', tags: ['訪問鍼灸'] },
  { file: 'project_houmon_resecon.md', type: 'knowledge', business_id: 'houmon', category: 'manual', title: '厚労省算定ルール（令和6年10月改定後）', tags: ['訪問鍼灸', '算定'] },
  { file: 'project_genba_voice_sources.md', type: 'knowledge', business_id: 'all', category: 'manual', title: '現場の声データソース（整体4種・訪問鍼灸要設計）', tags: ['データ', '現場'] },

  // ━━━ Threads ━━━
  { file: 'feedback_threads_writing.md', type: 'knowledge', business_id: 'all', category: 'manual', title: 'Threads投稿の文体ルール', tags: ['Threads', '文体'] },
  { file: 'project_threads_auto_design.md', type: 'knowledge', business_id: 'all', category: 'manual', title: 'Threads自動投稿の運用設計', tags: ['Threads', '自動化'] },

  // ━━━ 運用・参照 ━━━
  { file: 'project_work_design.md', type: 'knowledge', business_id: 'all', category: 'manual', title: '週間設計（曜日別役割・思考日・休み方）', tags: ['運用', '週間設計'] },
  { file: 'reference_zoom_recording.md', type: 'knowledge', business_id: 'all', category: 'reference', title: 'Zoom録画の保存先・整理ルール', tags: ['Zoom', 'ルール'] },
  { file: 'reference_legal_template.md', type: 'knowledge', business_id: 'all', category: 'reference', title: '全アプリ3点セット（規約/PP/決済同意）の雛形', tags: ['法的', '規約'] },
  { file: 'feedback_security_standard.md', type: 'knowledge', business_id: 'all', category: 'manual', title: '全アプリ共通セキュリティ・コンプライアンス基準', tags: ['セキュリティ'] },
  { file: 'feedback_writing_style.md', type: 'knowledge', business_id: 'all', category: 'manual', title: '文章作成NGルール（AI記事っぽさ・絵文字NG）', tags: ['文章', 'NG'] },
  { file: 'feedback_quality_standard.md', type: 'knowledge', business_id: 'all', category: 'manual', title: '品質基準（Clinic Core外部展開対応）', tags: ['品質'] },
]

// frontmatter を除いて本文を返す
function readBody(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)
  return (match ? match[1] : raw).trim()
}

;(async () => {
  const c = new Client({ connectionString: PG_URL })
  await c.connect()
  console.log(`📚 メモリインポート開始（${MANIFEST.length}件）`)

  let ok = 0, skip = 0, err = 0

  for (const m of MANIFEST) {
    const filePath = path.join(MEMORY_DIR, m.file)
    if (!fs.existsSync(filePath)) {
      console.log(`  - skip (not found): ${m.file}`)
      skip++
      continue
    }
    let body
    try {
      body = readBody(filePath)
    } catch (e) {
      console.log(`  ! read error: ${m.file} (${e.message}) → skip`)
      skip++
      continue
    }
    if (!body) {
      console.log(`  - empty: ${m.file}`)
      skip++
      continue
    }

    const table = m.type === 'context' ? 'office_context_items' : 'office_knowledge'
    try {
      // 既存チェック（同一title+source_ref）→ 重複回避
      const exist = await c.query(
        `SELECT id FROM ${table} WHERE source_ref = $1 LIMIT 1`,
        [m.file]
      )
      if (exist.rows.length > 0) {
        // 更新
        await c.query(
          `UPDATE ${table}
            SET title = $1, content = $2, tags = $3::jsonb, business_id = $4, category = $5, updated_at = NOW()
            WHERE id = $6`,
          [m.title, body, JSON.stringify(m.tags), m.business_id, m.category, exist.rows[0].id]
        )
        console.log(`  ↻ updated: ${m.file} → ${table} (${m.business_id}/${m.category})`)
      } else {
        await c.query(
          `INSERT INTO ${table} (business_id, category, title, content, tags, source, source_ref)
           VALUES ($1, $2, $3, $4, $5::jsonb, 'memory_import', $6)`,
          [m.business_id, m.category, m.title, body, JSON.stringify(m.tags), m.file]
        )
        console.log(`  ✓ inserted: ${m.file} → ${table} (${m.business_id}/${m.category})`)
      }
      ok++
    } catch (e) {
      console.log(`  ✗ db error: ${m.file} (${e.message})`)
      err++
    }
  }

  console.log(`\n完了: ${ok} 件投入 / ${skip} 件スキップ / ${err} 件エラー`)
  await c.end()
})().catch(e => { console.error(e); process.exit(1) })

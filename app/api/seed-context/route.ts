import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// メモリファイルから取得した全データをvo_contextテーブルに投入
const seedData = [
  // ━━━ ミッション・ビジョン ━━━
  {
    category: 'mission_vision',
    title: 'ミッション（外向き・社会への約束）',
    content: '「できない」を「できる」に変え、光を灯す。',
    sort_order: 1,
  },
  {
    category: 'mission_vision',
    title: 'ビジョン（目指す世界）',
    content: '挑戦を諦めない人が増え、温かく支え合える社会。',
    sort_order: 2,
  },
  {
    category: 'mission_vision',
    title: 'バリュー（内向き・行動基準）',
    content: '想いを創造し、チャレンジを楽しむ。',
    sort_order: 3,
  },
  {
    category: 'mission_vision',
    title: '役割・セルフイメージ',
    content: '想いに寄り添い、共に成長できる環境を創るサポーター。',
    sort_order: 4,
  },
  {
    category: 'mission_vision',
    title: '存在意義',
    content: '痛みや不調で止まった人生に、もう一度「自由にやりたい事をやってもいい」という選択肢を渡すため。',
    sort_order: 5,
  },
  {
    category: 'mission_vision',
    title: '顧客満足度5原則',
    content: '①判断を奪わない（選択肢を出して「どうしたいですか？」で締める）\n②人生を否定しない（過去の治療・選択を肯定する）\n③誠実に伝える（良いこと＋厳しいことをセットで）\n④尊厳を守る（結果が出なくても関係を切らない）\n⑤人生のベクトルを忘れない（ゴールは生活・人生の中に置く）',
    sort_order: 6,
  },
  {
    category: 'mission_vision',
    title: '法人化に向けた4本柱',
    content: '①整体の経営（安定収益・専門性の源泉）\n②訪問鍼灸（スタッフ拡大でスケール）\n③治療機器の販売（BR・血管顕微鏡のBtoB）\n④Claude Codeを使ったアプリ開発（BtoB SaaS・高スケーラビリティ）',
    sort_order: 7,
  },

  // ━━━ ブランド・ポジション ━━━
  {
    category: 'brand',
    title: '院のポジショニング',
    content: '「病院と整体院のあいだで、筋骨格だけではなく神経まで含めて身体を見直す場所」\n\n・どこに行っても変わらなかった理由を、一緒に見つける整体院\n・治療の前に、まず原因を知る場所',
    sort_order: 1,
  },
  {
    category: 'brand',
    title: '院の強み',
    content: '・神経整体 × 内臓 × 骨格 × 東洋医学と幅広い考えがある\n・ソフトな施術が中心\n・重症・慢性症状に特化した治療院\n・姿勢・歩行・生活動作まで確認する\n・改善後の未来づくりまで寄り添う',
    sort_order: 2,
  },
  {
    category: 'brand',
    title: '大口先生の強み3つ',
    content: '①東洋医学と構造医学と神経の治療を掛け合わせた治療ができる → 違う原因が見つけられる\n②会話の引き出しが多い、共通の話題を見つけやすい → 人に合わせたコミュニケーション\n③（検討中）',
    sort_order: 3,
  },
  {
    category: 'brand',
    title: '商品コンセプト5段階',
    content: '①痛み和らげる → ②歪み整える → ③血流・腸内環境の改善・吸収排泄の改善 → ④栄養補給 → ⑤自律神経失調症改善',
    sort_order: 4,
  },
  {
    category: 'brand',
    title: 'スケールトーク（不調の5段階）',
    content: '①疲労感・軽度のストレス（ストレスでだるくなる）\n②身体的不調（何かしらの症状出る）\n③精神的な疾患・情緒不安定（内臓の不調、お通じ、逆流性）\n④社会生活の困難（精神的にやむ）\n⑤日常生活の困難（動けなくなる→社会復帰できない、家族と疎遠）',
    sort_order: 5,
  },
  {
    category: 'brand',
    title: 'BtoBポジショニング',
    content: '「治療家プログラマー」大口陽平\n現役治療家が自分で使うアプリを作って同業者に売る唯一のポジション\n\nブランドメッセージ: 「治療家が、自分の手で院を変えられる時代が来た。僕はそのためのツールを、現場の治療家として作り続ける。」\n\n立ち位置: 「売る人」ではなく「一緒に現場を良くする仲間」。押し売りしない、必要ない人には正直に言う。',
    sort_order: 6,
  },

  // ━━━ 重点施策 ━━━
  {
    category: 'focus',
    title: '2026年 重点施策8つ',
    content: '①初芝事務所の施術・セミナー対応化\n②訪問スタッフ3人の業務委託契約化\n③右腕育成（施術長候補）\n④BR・血管顕微鏡のBtoBツール化\n⑤オンライン睡眠カウンセリング開始\n⑥UTAGE構築（広告→リスト→教育→来院→成約の自動化）\n⑦既存患者の教育自動化（LINE・動画）\n⑧検査アプリSaaS化・BtoB月額課金スタート',
    sort_order: 1,
  },
  {
    category: 'focus',
    title: '現在の注力ポイント6つ',
    content: '①検査アプリSaaS化（Supabase Auth + RLS + Stripe月額5,500円）\n②MEO勝ち上げくんモニター10名→有料転換（月額1,980円、6月切替）\n③BtoB Facebook教育ローンチ（認知→Zoom商談→月額契約）\n④高額メニュー3つ作成（睡眠・頭髪・体質改善ダイエット）\n⑤UTAGE構築（広告→リスト→教育→来院→成約の自動化）\n⑥訪問スタッフ3名体制の確立（業務委託）',
    sort_order: 2,
  },
  {
    category: 'focus',
    title: 'CSF（重要成功要因）',
    content: '・既存単価UP（9,500円→12,000円）\n・高額メニュー作成（睡眠・頭髪・ダイエット）\n・YouTube＋折込に広告費集中（ROAS最良チャネル）\n・BtoB SaaS 限定20名ベータ→月額課金転換',
    sort_order: 3,
  },
  {
    category: 'focus',
    title: '顧客セグメント管理',
    content: '超優良: サブスク + 物販 + 回数券再購入 → VIP対応・特別案内\n優良: 回数券購入・定期来院 → 継続フォロー・アップセル\nリピーター: 月1〜2回来院 → 頻度向上・サブスク提案\nその他: 単発・離脱予備軍 → 再来院フォロー・LINE配信',
    sort_order: 4,
  },

  // ━━━ 年度目標 ━━━
  {
    category: 'yearly',
    title: '整体院 詳細KPI',
    content: '月商: 200〜300万円（現在約240万円）\nカルテ: 65枚目標（現在61枚）\n来院頻度: 3.5回目標（現在3.0回）\nサブスク売上: 80万円目標（現在54〜61万円、27人）\n稼働率: 75%目標（現在71%）\n既存単価: 12,000円目標（現在9,500円）\n物販: 月15万円目標',
    sort_order: 1,
  },
  {
    category: 'yearly',
    title: '訪問鍼灸ロードマップ',
    content: '現在: スタッフ2名、月商160万円、健康保険モデル（取り分25〜30%）\n2026年: スタッフ3名体制（業務委託契約化・右腕育成・初芝事務所整備）\n2年後（32歳）: スタッフ5名\n3年後（33歳）: スタッフ7名',
    sort_order: 2,
  },
  {
    category: 'yearly',
    title: '中長期年商目標',
    content: '2026年: 整体院2,400〜3,600万 + 訪問鍼灸1,920〜3,600万\n2年後（32歳）: 年商6,850万円（技術セミナー300万、睡眠特化サロン年1,200万）\n3年後（33歳）: 年商9,400万円（スポーツジム経営開始 年1,800万）',
    sort_order: 3,
  },
  {
    category: 'yearly',
    title: '長期ビジョン',
    content: '・市内マンション購入\n・奈良に川サウナ・アーシング施設\n・自分がいなくても回るシステム構築\n・治療機器販売→スポーツジム経営→自動化システム',
    sort_order: 4,
  },
  {
    category: 'yearly',
    title: '2025年実績サマリー',
    content: '年間売上: 24,354,226円\n新規売上: 17,975,928円（70%）\n既存売上: 6,378,298円（30%）\n新患: 148名、施術: 1,909回\n平均LTV: 121,459円、リピーターLTV: 151,058円\nベスト月: 369万円（11月）',
    sort_order: 5,
  },
  {
    category: 'yearly',
    title: '広告チャネル別ROAS',
    content: 'YouTube: LTV21万円（21名）→ ROAS最高、信頼度高い\nチラシ: LTV20万円（5名）→ 少数だがLTV高い\n折込: LTV20万円（28名）→ 件数も多くバランス良い\nHP: LTV13万円（85名）→ 最多だが相対的にLTV低い',
    sort_order: 6,
  },

  // ━━━ 週間設計 ━━━
  {
    category: 'work_design',
    title: '週間スケジュール',
    content: '月: 新規のみ・作業（10人）→ 判断・評価\n火: 施術（10人）→ 安定\n水: 思考・構築（0人）→ 未来（院にいない日）\n木: 施術（10人）→ 安定\n金: 施術（10人）→ 安定\n土: 施術・学び（0〜8人）→ 余白\n日: 完全オフ（0人）→ 回復',
    sort_order: 1,
  },
  {
    category: 'work_design',
    title: '思考・構築日（超重要）',
    content: '週1日の「院にいない日」。施術しない。\n\nやること: HP・ブログ・動画の構成 / 患者さんの「流れ」整理 / サービスの見直し / 数字を見る（感情抜きで）\n場所: カフェ or 自然がある場所、パソコン＋ノートだけ\n\n「ここを削ると、必ず虚無る」',
    sort_order: 2,
  },
  {
    category: 'work_design',
    title: '稼働設計',
    content: '15日/月 × 10時間/日\n2枠/時間 = 300枠/月\n稼働率70% = 210枠/月\n新規は2時間枠（月10人 = 20時間）\n15日で10時間、16日で9時間は常に空けておく',
    sort_order: 3,
  },
  {
    category: 'work_design',
    title: '学び・交流日',
    content: '月4〜5回は「外に出る日」\n・勉強会・セミナー\n・尊敬できる人とご飯\n・全く違う業界の人と話す\n\n目的:「正解を探さない」「視点を増やす」',
    sort_order: 4,
  },
  {
    category: 'work_design',
    title: '休みの日の過ごし方',
    content: '休み ≠ 何もしない日\n\n身体を使う: ゴルフ、散歩、サウナ、川・自然\n感性を使う: 車・時計・道具を見る、建築・空間、旅行の計画だけ立てる\n人といる: 家族、気を使わない友人、利害関係ゼロの時間\n\nSNS・仕事連絡は極力見ない / 「何か成果を出そう」としない',
    sort_order: 5,
  },

  // ━━━ キャンペーン ━━━
  {
    category: 'campaign',
    title: '4月: 自律神経ケア（新規）',
    content: '新年度が始まり、知らないうちに疲労が溜まりやすい4月。疲れが抜けない・朝がしんどい・気持ちが落ち着かない・首や肩が常に力んでいる。「まだ病院に行くほどではない」方に向けて、今の疲労が"体のサイン"であることに気づいてもらう。\nフックワード: 新生活疲労',
    sort_order: 1,
  },
  {
    category: 'campaign',
    title: '5月: GW明け疲労・5月病（新規）',
    content: '4月の環境変化で無意識に頑張り続けた疲れがGW明けに一気に出る。連休明けから急に疲れが抜けない・寝ても回復しない・仕事に集中しづらい・気力が戻らない。体の内側（回復力・体質・疲労の溜まり方）に目を向ける。\nフックワード: 5月病・GW明け疲労',
    sort_order: 2,
  },
  {
    category: 'campaign',
    title: '6月: 梅雨×頭痛ケア（新規）',
    content: '気圧や湿度の影響で頭痛が出やすく長引きやすい。雨の前後で繰り返す・首や肩のこりと一緒に出る・原因がはっきりしない。気圧変動・首まわりの緊張・自律神経の乱れに着目。\nフックワード: 梅雨×気圧×頭痛',
    sort_order: 3,
  },
  {
    category: 'campaign',
    title: '7月: ダイエット＋熱中症予防（新規・既存）',
    content: '薄着になる7月。無理に追い込むダイエットではなく、食事の整え方や体の使い方を見直す。体重だけでなく、だるさや重さも一緒に軽くする。夏バテや冷房による不調を防ぎながら、8月以降も崩れにくい体を作る。\nフックワード: 熱中症予防の体作り・冷房病対策',
    sort_order: 4,
  },
  {
    category: 'campaign',
    title: '8月: 睡眠の質改善（新規）',
    content: '暑さや冷房の影響で睡眠の質が落ちやすい。夜中に目が覚める・朝スッキリ起きられない・日中の疲れが取れない。「睡眠の質そのもの」が下がっていることが原因。回復できる睡眠を取り戻すために体と神経の状態を整える。\nフックワード: 熱中症予防・睡眠の質',
    sort_order: 5,
  },
  {
    category: 'campaign',
    title: '9月: 抜け毛・薄毛ケア（既存）',
    content: '夏の紫外線・汗・睡眠不足の影響が重なり、抜け毛や薄毛として症状がはっきり出やすい時期。頭皮環境・血流・体の内側から整理し、今後どう向き合っていくかを明確にする。\nフックワード: 夏ダメージ×抜け毛',
    sort_order: 6,
  },
  {
    category: 'campaign',
    title: '10月: 痛み・痺れ早期対策（新規）',
    content: '気温が下がり始め、年末・冬に向かう時期。残っている痛みや痺れを放置すると年末の忙しさや冬の冷えで症状が強く出る。神経・血流・体の使い方を整理し、悪化させないための準備を今のうちに。\nフックワード: 年末に向けた早期対策',
    sort_order: 7,
  },
  {
    category: 'campaign',
    title: '11月: 腸内環境・冷え性予防（既存）',
    content: '気温差が大きく体調を崩しやすい。年末年始にかけて食事量増加・生活リズムの乱れで腸内環境が乱れやすい。\nフックワード: 冷え性予防・冷えに強い体作り',
    sort_order: 8,
  },
  {
    category: 'campaign',
    title: '12月: 関節痛・神経痛ケア（新規）',
    content: '冷えが本格化し、関節や神経への負担が一気に強まる。年末の忙しさも重なり、関節のこわばり・神経痛のぶり返し・冷えると痛みやしびれが強くなる。冷えによる血流低下や神経への影響に着目。\nフックワード: 寒さによる関節痛対策',
    sort_order: 9,
  },
  {
    category: 'campaign',
    title: '1月: ダイエット＋お年玉（新規・既存）',
    content: '年末年始で増えた体重や、乱れた食生活を無理なく元に戻す月。「痩せる」ことを目的にするのではなく、まずはリセットすることを重視。\nフックワード: 正月太りリセット',
    sort_order: 10,
  },
  {
    category: 'campaign',
    title: '2月: 冷え×神経痛（新規・掘り起こし）',
    content: '寒さで血流が落ちやすい2月は、神経や筋肉が回復しにくく、痛みやしびれが冷えによって悪化しやすい時期。悪化する前に整えておく必要性をお伝えする。\nフックワード: 冷え×神経痛',
    sort_order: 11,
  },
  {
    category: 'campaign',
    title: '3月: 腸内環境リセット（既存）',
    content: '花粉やアレルギー反応が出やすく、新年度に向けてストレスがかかりやすい時期。腸内環境が乱れやすい。玄米麹あま酒を含むファスティング・体質調整を行い、4月を安定した体調で迎える。\nフックワード: 花粉・アレルギー対策',
    sort_order: 12,
  },
  {
    category: 'campaign',
    title: '広告戦略メモ（メンター助言）',
    content: '一般的に整体と結びつけていないことを「整体という手段がある」と訴求する\n例: 熱中症予防×整体、冷房病×整体、5月病×整体\n新しいジャンルとしての広告を作る意識\n検索ワードが時期で上がるタイミングに合わせた訴求が効果的',
    sort_order: 13,
  },

  // ━━━ BtoB販売導線 ━━━
  {
    category: 'btob_sales',
    title: 'Step1: 認知（Facebook投稿）',
    content: '週3〜5回投稿\nテーマ配分: AIアプリ優先 / 治療機器 / 整体院経営 / 訪問鍼灸 / ストーリー\n成功も失敗も泥臭い部分も見せる',
    sort_order: 1,
  },
  {
    category: 'btob_sales',
    title: 'Step2: リスト取り（オープンチャット）',
    content: '「治療家のためのアプリ活用ラボ」\n価値提供8：告知2の比率\n週2〜3回の投稿',
    sort_order: 2,
  },
  {
    category: 'btob_sales',
    title: 'Step3: 検討（Zoom実演会）',
    content: '月1〜2回のZoom実演会 / 個別相談\n実際の画面を見せてデモ',
    sort_order: 3,
  },
  {
    category: 'btob_sales',
    title: 'Step4: 購入（アプリ購入サイト）',
    content: 'Stripe決済\n限定20名ベータ→月額転換\n単品販売 + セット割引（2本5%〜6本25%OFF）',
    sort_order: 4,
  },
  {
    category: 'btob_sales',
    title: 'Step5: 継続（カスタマーサクセス）',
    content: '導入サポート・定着化\n解約防止・アップセル\n定期フォローとオンボーディング改善',
    sort_order: 5,
  },
  {
    category: 'btob_sales',
    title: 'BtoB SaaS 価格表',
    content: '検査アプリ: 月5,500円（買切55,000〜110,000円）\n顧客管理シート: 月4,980円\n予約管理: 月2,980円\nWEB問診: 月2,980円\nMEO勝ち上げくん: 月2,980円\n睡眠チェック: 月1,980円\n\n統合プラン: 月19,800円（5アプリ）/ 年198,000円\nプレミアム: 月39,800円（全機能+カスタマイズ+サポート）\n初期設定: 110,000円',
    sort_order: 6,
  },

  // ━━━ ルール・方針 ━━━
  {
    category: 'rules',
    title: '外部投稿の自動化禁止',
    content: 'SNS・LINE・GBP等への外部投稿は自動化しない方針。AI社員の役割は「そのまま使える完成度の原稿・資料を作る」まで。実際の投稿・発信は大口さんが確認して手動で行う。',
    sort_order: 1,
  },
  {
    category: 'rules',
    title: '全アプリ共通の契約ルール',
    content: '①再登録不可（解約済みメールアドレスはブロック）\n②最低契約期間6ヶ月（月額プラン）\n③早期解約金（残り月数 × 月額料金）\n④解約時アプリ停止（is_active=false → /suspendedリダイレクト）',
    sort_order: 2,
  },
  {
    category: 'rules',
    title: 'BtoB表記ルール',
    content: 'BtoBと表記する（B2Bではなく）。全ての文書・コード・UIで統一。',
    sort_order: 3,
  },
  {
    category: 'rules',
    title: '文章作成ルール',
    content: '・AI記事っぽい文体にしない\n・絵文字を使わない\n・AI独特の記号（━━、★、▶︎、✅ など）を使わない\n・アプリ紹介は名前だけの箇条書きで数の多さで圧倒させる',
    sort_order: 4,
  },
  {
    category: 'rules',
    title: '三点一致ルール',
    content: 'フォルダ名・管理ファイル（data.ts）・画面表示の3つを必ず同時に更新する。片方だけの更新は禁止。',
    sort_order: 5,
  },
  {
    category: 'rules',
    title: 'セキュリティ基準',
    content: '・認証ミドルウェア必須\n・RLS（clinic_idでデータ分離）\n・APIキーは環境変数管理\n・APIルート保護\n・XSS対策（DOMPurify）\n・サーバーサイドクライアント推奨\n・Vercelプロジェクト名は汎用名禁止',
    sort_order: 6,
  },
]

export async function POST() {
  try {
    // 既存データの件数を確認
    const { count } = await supabase
      .from('vo_context')
      .select('*', { count: 'exact', head: true })

    // 既に大量のデータがある場合はスキップ
    if (count && count >= 30) {
      return NextResponse.json({
        message: `既に${count}件のデータがあります。重複を避けるためスキップしました。`,
        skipped: true,
        existingCount: count,
      })
    }

    // データを投入
    const { data, error } = await supabase
      .from('vo_context')
      .insert(seedData)
      .select()

    if (error) throw error

    return NextResponse.json({
      message: `${data.length}件のコンテキストデータを投入しました`,
      inserted: data.length,
      categories: {
        mission_vision: seedData.filter(d => d.category === 'mission_vision').length,
        brand: seedData.filter(d => d.category === 'brand').length,
        focus: seedData.filter(d => d.category === 'focus').length,
        yearly: seedData.filter(d => d.category === 'yearly').length,
        work_design: seedData.filter(d => d.category === 'work_design').length,
        campaign: seedData.filter(d => d.category === 'campaign').length,
        btob_sales: seedData.filter(d => d.category === 'btob_sales').length,
        rules: seedData.filter(d => d.category === 'rules').length,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

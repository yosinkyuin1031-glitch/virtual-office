// ゴール解析: ゴール文からどの部署・社員を動かすか判定するロジック

import { employeePrompts, EmployeePrompt } from './employee-prompts';

export interface GoalAnalysis {
  departments: string[];
  employees: string[];
  employeePrompts: EmployeePrompt[];
  taskType: string;
  taskDescriptions: Record<string, string>; // employee id -> task description
}

// キーワード → 社員IDのマッピング
const keywordToEmployees: Record<string, string[]> = {
  // コンテンツ系
  'facebook投稿': ['fumi', 'jin'],
  'fb投稿': ['fumi', 'jin'],
  'sns投稿': ['fumi'],
  'instagram': ['fumi'],
  'line配信': ['fumi'],
  'line': ['fumi'],
  'ブログ': ['rin', 'fumi'],
  '記事': ['rin', 'fumi'],
  'seo記事': ['rin'],
  'faq': ['rin'],
  'コピー': ['fumi'],
  '投稿': ['fumi'],
  'コンテンツ': ['fumi', 'rin'],

  // 集客系
  'meo': ['haru'],
  'gbp': ['haru'],
  'google': ['haru'],
  '広告': ['haru'],
  '集客': ['haru', 'shou'],
  'キーワード': ['haru', 'rin'],
  'キャンペーン': ['haru', 'fumi', 'maya'],

  // 財務系
  '売上': ['misa', 'reia'],
  '収益': ['misa'],
  'kpi': ['misa', 'reia'],
  '予算': ['misa'],
  '請求': ['misa'],
  'コスト': ['misa'],
  '分析': ['misa', 'sena'],
  'レポート': ['misa'],

  // AI開発系
  'アプリ': ['tetsu', 'kou'],
  '開発': ['tetsu', 'kou'],
  'バグ': ['kou'],
  '修正': ['kou'],
  'saas': ['tetsu', 'kou'],
  'デプロイ': ['taku'],
  'インフラ': ['taku'],
  'api': ['kou'],

  // BtoB系
  'btob': ['jin', 'tetsu', 'shou'],
  '営業': ['jin', 'shou'],
  '提案書': ['jin'],
  '商談': ['jin'],
  'モニター': ['jin', 'aoi'],
  '競合': ['sena'],
  'リサーチ': ['sena'],

  // LP系
  'lp': ['maya', 'fumi'],
  'ランディングページ': ['maya'],
  'hp': ['rin'],
  'ホームページ': ['rin'],

  // メディア系
  'youtube': ['tsuki'],
  '動画': ['tsuki'],
  'ヒーリング': ['tsuki'],
  'shorts': ['tsuki'],

  // カスタマーサクセス系
  'オンボーディング': ['aoi'],
  '導入': ['aoi'],
  '解約': ['aoi'],
  '顧客成功': ['aoi'],
  'セミナー': ['shou'],
  'ウェビナー': ['shou'],

  // 経営系
  '戦略': ['reia'],
  '事業計画': ['reia'],
  '法人化': ['reia'],
  'ビジョン': ['reia'],
  '方針': ['reia'],
  '年商': ['reia', 'misa'],

  // タスク管理系
  'タスク': ['miko'],
  'スケジュール': ['miko'],
  '日報': ['miko'],
  '整理': ['miko'],

  // 全社キーワード
  '全部署': ['reia', 'miko', 'fumi', 'haru', 'misa', 'tetsu', 'jin', 'kana'],
  '年商100億': ['reia', 'miko', 'fumi', 'haru', 'misa', 'tetsu', 'jin', 'kana'],
  '全体計画': ['reia', 'miko', 'misa', 'tetsu', 'kana'],
};

// タスクタイプの判定
const taskTypeKeywords: Record<string, string[]> = {
  'content-creation': ['投稿', '記事', 'コンテンツ', 'ブログ', 'コピー', '作成', '書いて', '書く'],
  'analysis': ['分析', 'レポート', '調査', 'リサーチ', '競合', 'KPI'],
  'strategy': ['戦略', '計画', '方針', 'プラン', '設計'],
  'development': ['開発', '修正', 'バグ', 'デプロイ', 'アプリ', '実装'],
  'sales': ['営業', '提案', '商談', 'BtoB', 'btob', 'モニター'],
  'customer-success': ['導入', 'オンボーディング', '解約', 'フォロー'],
  'marketing': ['集客', 'SEO', 'MEO', '広告', 'GBP', 'キャンペーン'],
  'management': ['タスク', 'スケジュール', '整理', '日報', '管理'],
};

export function analyzeGoal(goal: string): GoalAnalysis {
  const goalLower = goal.toLowerCase();
  const matchedEmployeeIds = new Set<string>();

  // キーワードマッチング
  for (const [keyword, employeeIds] of Object.entries(keywordToEmployees)) {
    if (goalLower.includes(keyword.toLowerCase())) {
      employeeIds.forEach(id => matchedEmployeeIds.add(id));
    }
  }

  // マッチしなかった場合はレイアとミコをデフォルトに
  if (matchedEmployeeIds.size === 0) {
    matchedEmployeeIds.add('reia');
    matchedEmployeeIds.add('miko');
  }

  // タスクタイプの判定
  let taskType = 'general';
  let maxMatches = 0;
  for (const [type, keywords] of Object.entries(taskTypeKeywords)) {
    const matches = keywords.filter(k => goalLower.includes(k.toLowerCase())).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      taskType = type;
    }
  }

  // 社員プロンプトを収集
  const matchedPrompts: EmployeePrompt[] = [];
  const departments = new Set<string>();
  const employees: string[] = [];
  const taskDescriptions: Record<string, string> = {};

  for (const empId of matchedEmployeeIds) {
    const prompt = employeePrompts[empId];
    if (prompt) {
      matchedPrompts.push(prompt);
      departments.add(prompt.department);
      employees.push(prompt.name);
      // タスク説明を生成
      taskDescriptions[empId] = generateTaskDescription(goal, prompt);
    }
  }

  return {
    departments: Array.from(departments),
    employees,
    employeePrompts: matchedPrompts,
    taskType,
    taskDescriptions,
  };
}

function generateTaskDescription(goal: string, employee: EmployeePrompt): string {
  return `以下のゴールに対して、あなたの専門分野の観点から具体的なアウトプットを作成してください。

【ゴール】
${goal}

【あなたの担当】
${employee.name}（${employee.department} / ${employee.role}）

【指示】
- あなたの専門領域に関係する部分だけを担当してください
- 具体的で、すぐに使えるアウトプットを出してください
- 他の部署と連携が必要な部分は「連携ポイント」として明記してください
- 日本語で回答してください`;
}

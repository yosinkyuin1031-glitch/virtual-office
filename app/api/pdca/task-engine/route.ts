import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCronAuth,
  getSupabase,
  getAnthropicClient,
  callClaude,
  getJSTDateRange,
  logActivity,
} from '../../../lib/pdca-utils'
import { employeePrompts, getEmployeePromptsByDepartment } from '../../../lib/employee-prompts'

export const runtime = 'nodejs'
export const maxDuration = 120

// タスク自動実行エンジン
// 10分ごとに実行: highタスクを最大2件ピックアップ → AI社員が実行 → 結果を保存
// これにより「タスクが積まれるだけ」→「タスクが自動で消化される」に変わる
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabase()
    const client = getAnthropicClient()
    const { today } = getJSTDateRange()

    // 1. 実行対象タスクをピックアップ
    // 優先順位: high > normal、期限が近い順、古い順
    const { data: tasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true }) // high=先
      .order('due_date', { ascending: true, nullsFirst: false }) // 期限近い順
      .order('created_at', { ascending: true }) // 古い順
      .limit(2) // 1回あたり最大2件（API負荷対策）

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No pending tasks to execute' })
    }

    const results: Array<{
      id: string
      title: string
      department: string
      status: string
      summary?: string
      error?: string
    }> = []

    for (const task of tasks) {
      // 2. タスクをin_progressに更新
      await supabase
        .from('vo_tasks')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      // 3. 担当AI社員を特定
      const assignedEmployee = findEmployee(task.employee_name, task.department)
      const employeeName = assignedEmployee?.name || task.employee_name || '汎用AI'
      const department = assignedEmployee?.department || task.department || '全社'

      // 活動ログ: タスク着手
      await logActivity(employeeName, department, 'タスク着手',
        `[${task.priority}] ${task.title}`)

      try {
        // 4. AI社員のシステムプロンプトでタスクを実行
        const systemPrompt = buildTaskSystemPrompt(assignedEmployee, task)
        const userMessage = buildTaskUserMessage(task)

        const result = await callClaude(client, systemPrompt, userMessage, 3000)

        // 5. タスクを完了に更新
        await supabase
          .from('vo_tasks')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        // 6. 実行結果をcommands形式で保存（他の部分から参照可能に）
        await supabase.from('commands').insert({
          instruction: `【タスク自動実行】${task.title}\n${task.description || ''}`,
          status: 'completed',
          result: result.substring(0, 10000),
          assigned_department: department,
          assigned_employee: employeeName,
          source: 'auto',
          completed_at: new Date().toISOString(),
        })

        // 7. 活動ログ: 完了
        const summary = result.substring(0, 200)
        await logActivity(employeeName, department, 'タスク完了',
          `${task.title}\n結果: ${summary}`)

        results.push({
          id: task.id,
          title: task.title,
          department,
          status: 'completed',
          summary,
        })

        // 8. 連鎖タスクの検知
        // タスク結果の中に他部署への依頼が含まれていれば自動生成
        await detectFollowUpTasks(supabase, task, result, today)

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)

        // 失敗時はpendingに戻す（次回再挑戦）
        await supabase
          .from('vo_tasks')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        await logActivity(employeeName, department, 'タスク実行エラー',
          `${task.title}: ${errMsg}`)

        results.push({
          id: task.id,
          title: task.title,
          department,
          status: 'error',
          error: errMsg,
        })
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      executed: results.filter(r => r.status === 'completed').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// 社員名 or 部署名からAI社員を特定
function findEmployee(employeeName?: string | null, department?: string | null) {
  // 名前で検索
  if (employeeName) {
    const found = Object.values(employeePrompts).find(
      ep => ep.name === employeeName
    )
    if (found) return found
  }

  // 部署で検索（部長を優先的に返す）
  if (department) {
    const deptEmployees = getEmployeePromptsByDepartment(department)
    if (deptEmployees.length > 0) return deptEmployees[0]
  }

  // デフォルト: レイア
  return employeePrompts['reia'] || null
}

// タスク実行用のシステムプロンプト
function buildTaskSystemPrompt(
  employee: { name: string; department: string; role: string; systemPrompt: string } | null,
  task: { department?: string; priority?: string }
) {
  const base = employee?.systemPrompt || `あなたは大口ヘルスケアグループのAI社員です。与えられたタスクを確実に実行してください。`

  return `${base}

【タスク実行モード】
あなたは今、自動タスク実行エンジンから呼び出されています。
以下のルールに従ってください:

1. タスクの指示を正確に実行し、具体的な成果物を出力してください
2. 「検討します」「考えます」ではなく、実際に作成・実行した結果を出してください
3. 他の部署との連携が必要な場合は【連携依頼】として明記してください
4. 回答はプレーンテキストで、マークダウン記号は使わないでください
5. 優先度: ${task.priority || 'normal'}
6. 所属: ${task.department || employee?.department || '全社'}`
}

// タスクをユーザーメッセージに変換
function buildTaskUserMessage(task: {
  title: string
  description?: string
  department?: string
  due_date?: string
  generated_by?: string
}) {
  const lines = [
    `【タスク】${task.title}`,
    '',
  ]

  if (task.description) {
    lines.push(`【詳細】`)
    lines.push(task.description)
    lines.push('')
  }

  if (task.due_date) {
    lines.push(`【期限】${task.due_date}`)
  }

  if (task.generated_by) {
    lines.push(`【発行元】${task.generated_by}`)
  }

  lines.push('')
  lines.push('上記のタスクを実行し、結果を報告してください。')

  return lines.join('\n')
}

// 連鎖タスクの検知: 実行結果に他部署への依頼が含まれていれば自動生成
async function detectFollowUpTasks(
  supabase: ReturnType<typeof getSupabase>,
  originalTask: { id: string; title: string; department: string; batch_id?: string },
  result: string,
  today: string
) {
  // 【連携依頼】パターンを検知
  const handoffPattern = /【連携依頼】([^\n]+)/g
  const matches = [...result.matchAll(handoffPattern)]

  if (matches.length === 0) return

  for (const match of matches) {
    const handoffText = match[1].trim()

    // 部署名を推定
    const deptKeywords: Record<string, string> = {
      'LP': 'LP・Web制作部',
      'ランディング': 'LP・Web制作部',
      'SEO': 'LP・Web制作部',
      'デザイン': 'LP・Web制作部',
      '営業': 'BtoB営業部',
      'BtoB': 'BtoB営業部',
      '開発': 'AI開発部',
      'アプリ': 'AI開発部',
      '動画': 'メディア部',
      'YouTube': 'メディア部',
      '導入': 'カスタマーサクセス部',
      'オンボーディング': 'カスタマーサクセス部',
      '財務': '財務部',
      '売上': '財務部',
      'MEO': '整体院事業部',
      '集客': '整体院事業部',
      '訪問': '訪問鍼灸事業部',
    }

    let targetDept = '経営層' // デフォルト
    for (const [keyword, dept] of Object.entries(deptKeywords)) {
      if (handoffText.includes(keyword)) {
        targetDept = dept
        break
      }
    }

    await supabase.from('vo_tasks').insert({
      department: targetDept,
      title: handoffText.substring(0, 30),
      description: `【自動連鎖タスク】\n元タスク: ${originalTask.title}（${originalTask.department}）\n\n${handoffText}`,
      priority: 'normal',
      status: 'pending',
      due_date: today,
      batch_id: `chain_${originalTask.batch_id || originalTask.id}`,
      generated_by: 'task_engine_chain',
    })
  }
}

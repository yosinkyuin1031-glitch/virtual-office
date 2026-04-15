import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply'

// LINE返信送信
async function replyToLine(replyToken: string, message: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  const truncated = message.length > 4900 ? message.substring(0, 4900) + '\n...(省略)' : message
  await fetch(LINE_REPLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: truncated }],
    }),
  }).catch(() => {})
}

// 定期タスクコマンドを処理
async function handleRecurringTaskCommand(text: string, replyToken: string): Promise<boolean> {
  const trimmed = text.trim()

  // 「定期タスク一覧」
  if (trimmed === '定期タスク一覧') {
    const { data: tasks } = await supabase
      .from('vo_recurring_tasks')
      .select('*')
      .eq('is_active', true)
      .order('day_of_month', { ascending: true })

    if (!tasks || tasks.length === 0) {
      await replyToLine(replyToken, '📅 定期タスクは登録されていません')
      return true
    }

    let msg = `📅 定期タスク一覧（${tasks.length}件）\n━━━━━━━━━━━━━\n`
    for (const t of tasks) {
      const dayLabel = t.day_type === 'last_day' ? '月末' : `${t.day_of_month}日`
      msg += `\n${dayLabel}【${t.business_unit}】\n✅ ${t.title}\n`
    }
    await replyToLine(replyToken, msg)
    return true
  }

  // 「定期タスク追加：毎月15日 〇〇」
  const addMatch = trimmed.match(/^定期タスク追加[：:]?\s*毎月(\d+)日\s+(.+)$/)
  if (addMatch) {
    const dayOfMonth = parseInt(addMatch[1])
    const title = addMatch[2].trim()

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      await replyToLine(replyToken, '日付は1〜31で指定してください')
      return true
    }

    // 事業判定
    let businessUnit = '大口神経整体院'
    const unitKeywords: Record<string, string> = {
      '訪問': '晴陽鍼灸院', '鍼灸': '晴陽鍼灸院', '晴陽': '晴陽鍼灸院',
      '機器': '治療機器販売', 'BR': '治療機器販売',
      'アプリ': 'アプリ事業', 'SaaS': 'アプリ事業', 'MEO': 'アプリ事業',
      'コミュニティ': '治療家コミュニティ', 'FCL': '治療家コミュニティ', 'セミナー': '治療家コミュニティ',
    }
    for (const [kw, unit] of Object.entries(unitKeywords)) {
      if (title.includes(kw)) { businessUnit = unit; break }
    }

    await supabase.from('vo_recurring_tasks').insert({
      title,
      business_unit: businessUnit,
      task_type: 'confirm',
      day_of_month: dayOfMonth,
      day_type: 'exact',
    })

    await replyToLine(replyToken, `✅ 定期タスク登録完了\n\n毎月${dayOfMonth}日\n【${businessUnit}】${title}`)
    return true
  }

  // 「定期タスク削除：〇〇」
  const deleteMatch = trimmed.match(/^定期タスク削除[：:]?\s*(.+)$/)
  if (deleteMatch) {
    const keyword = deleteMatch[1].trim()
    const { data: found } = await supabase
      .from('vo_recurring_tasks')
      .select('*')
      .ilike('title', `%${keyword}%`)
      .eq('is_active', true)
      .limit(1)

    if (found && found.length > 0) {
      await supabase
        .from('vo_recurring_tasks')
        .update({ is_active: false })
        .eq('id', found[0].id)
      await replyToLine(replyToken, `🗑️ 定期タスク削除\n${found[0].title}`)
    } else {
      await replyToLine(replyToken, `該当する定期タスクが見つかりません: ${keyword}`)
    }
    return true
  }

  return false
}

// タスク完了・一覧コマンドを処理
async function handleTaskStatusCommand(text: string, replyToken: string): Promise<boolean> {
  const trimmed = text.trim()
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstNow = new Date(now.getTime() + jstOffset)
  const today = jstNow.toISOString().split('T')[0]

  // 「終わった：〇〇」「終わった:〇〇」「完了：〇〇」
  const doneMatch = trimmed.match(/^(終わった|完了)[：:]\s*(.+)$/)
  if (doneMatch) {
    const keyword = doneMatch[2].trim()

    // キーワードでタスク検索（pending/in_progress）
    const { data: tasks } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .ilike('title', `%${keyword}%`)
      .limit(5)

    if (!tasks || tasks.length === 0) {
      await replyToLine(replyToken, `該当するタスクが見つかりません: ${keyword}`)
      return true
    }

    // 最もマッチするタスクを完了に
    const target = tasks[0]
    await supabase
      .from('vo_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_note: 'LINEから完了報告',
        updated_at: new Date().toISOString(),
      })
      .eq('id', target.id)

    await replyToLine(replyToken, `✅ タスク完了\n\n${target.title}\n【${target.department}】`)
    return true
  }

  // 「完了一覧」 or 「完了一覧 事業別」
  if (trimmed === '完了一覧' || trimmed === '完了一覧 事業別') {
    const byBusiness = trimmed === '完了一覧 事業別'
    const { data: completed } = await supabase
      .from('vo_tasks')
      .select('*')
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00+09:00`)
      .order('completed_at', { ascending: false })
      .limit(30)

    if (!completed || completed.length === 0) {
      await replyToLine(replyToken, `📋 本日の完了タスクはまだありません`)
      return true
    }

    // CCとooguchiで分離
    const ccDone = completed.filter(t => t.assignee_type === 'cc' || !t.assignee_type)
    const ooDone = completed.filter(t => t.assignee_type === 'ooguchi')
    const bothDone = completed.filter(t => t.assignee_type === 'both')

    let msg = `✅ 本日の完了タスク（${completed.length}件）\n━━━━━━━━━━━━━\n`

    const renderGroup = (label: string, list: typeof completed): string => {
      if (!list || list.length === 0) return ''
      let out = `\n${label}（${list.length}件）\n`
      if (byBusiness) {
        // 事業別にグループ化
        const groups: Record<string, typeof list> = {}
        for (const t of list) {
          const key = t.department || 'その他'
          if (!groups[key]) groups[key] = []
          groups[key].push(t)
        }
        for (const [dept, tasks] of Object.entries(groups)) {
          out += `\n【${dept}】\n`
          for (const t of tasks) out += `  ・${t.title}\n`
        }
      } else {
        for (const t of list) {
          const time = t.completed_at ? new Date(t.completed_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) : ''
          out += `${time} ${t.title}【${t.department}】\n`
        }
      }
      return out
    }

    msg += renderGroup('🤖 CCがやったこと', ccDone)
    msg += renderGroup('✅ 大口さんがやったこと', ooDone)
    msg += renderGroup('🤝 両方で進めたこと', bothDone)

    await replyToLine(replyToken, msg)
    return true
  }

  // 「未完了一覧」 or 「未完了一覧 事業別」
  if (trimmed === '未完了一覧' || trimmed === '未完了一覧 事業別') {
    const byBusiness = trimmed === '未完了一覧 事業別'
    const { data: pending } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .lte('due_date', today)
      .order('priority', { ascending: true })
      .limit(30)

    if (!pending || pending.length === 0) {
      await replyToLine(replyToken, `🎉 未完了タスクはありません！`)
      return true
    }

    const ccTasks = pending.filter(t => t.assignee_type === 'cc' || !t.assignee_type)
    const ooTasks = pending.filter(t => t.assignee_type === 'ooguchi')
    const bothTasks = pending.filter(t => t.assignee_type === 'both')

    let msg = `📋 未完了タスク（${pending.length}件）\n━━━━━━━━━━━━━\n`

    const renderPriorityGroup = (label: string, list: typeof pending): string => {
      if (!list || list.length === 0) return ''
      let out = `\n${label}（${list.length}件）\n`
      if (byBusiness) {
        const groups: Record<string, typeof list> = {}
        for (const t of list) {
          const key = t.department || 'その他'
          if (!groups[key]) groups[key] = []
          groups[key].push(t)
        }
        for (const [dept, tasks] of Object.entries(groups)) {
          out += `\n【${dept}】\n`
          for (const t of tasks) {
            const mark = t.priority === 'high' ? '🔴' : t.priority === 'low' ? '⚪' : '🟡'
            const lock = t.priority_locked ? '🔒' : ''
            out += `  ${mark}${lock} ${t.title}\n`
          }
        }
      } else {
        const high = list.filter(t => t.priority === 'high')
        const normal = list.filter(t => t.priority === 'medium' || !t.priority)
        const low = list.filter(t => t.priority === 'low')
        if (high.length > 0) {
          out += `\n  🔴 最優先\n`
          for (const t of high) out += `    ・${t.priority_locked ? '🔒' : ''}${t.title}\n`
        }
        if (normal.length > 0) {
          out += `\n  🟡 通常\n`
          for (const t of normal) out += `    ・${t.priority_locked ? '🔒' : ''}${t.title}\n`
        }
        if (low.length > 0) {
          out += `\n  ⚪ 低\n`
          for (const t of low) out += `    ・${t.priority_locked ? '🔒' : ''}${t.title}\n`
        }
      }
      return out
    }

    msg += renderPriorityGroup('🤖 CCがやること', ccTasks)
    msg += renderPriorityGroup('✅ 大口さんがやること', ooTasks)
    msg += renderPriorityGroup('🤝 両方で進めること', bothTasks)

    await replyToLine(replyToken, msg)
    return true
  }

  // 「優先度：○○ 高/中/低」 手動変更コマンド
  const priorityMatch = trimmed.match(/^優先度[：:]\s*(.+?)\s+(高|中|低)$/)
  if (priorityMatch) {
    const keyword = priorityMatch[1].trim()
    const levelLabel = priorityMatch[2]
    const levelMap: Record<string, string> = { '高': 'high', '中': 'medium', '低': 'low' }
    const newPriority = levelMap[levelLabel]

    const { data: found } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .ilike('title', `%${keyword}%`)
      .limit(1)

    if (!found || found.length === 0) {
      await replyToLine(replyToken, `該当するタスクが見つかりません: ${keyword}`)
      return true
    }

    await supabase
      .from('vo_tasks')
      .update({
        priority: newPriority,
        priority_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', found[0].id)

    const mark = newPriority === 'high' ? '🔴' : newPriority === 'low' ? '⚪' : '🟡'
    await replyToLine(replyToken, `${mark} 優先度を「${levelLabel}」に変更しました\n\n${found[0].title}\n【${found[0].department}】\n🔒 手動設定のため AI 自動調整から除外`)
    return true
  }

  // 「優先度ロック解除：○○」 AI自動調整に戻す
  const unlockMatch = trimmed.match(/^優先度ロック解除[：:]\s*(.+)$/)
  if (unlockMatch) {
    const keyword = unlockMatch[1].trim()
    const { data: found } = await supabase
      .from('vo_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .ilike('title', `%${keyword}%`)
      .limit(1)

    if (!found || found.length === 0) {
      await replyToLine(replyToken, `該当するタスクが見つかりません: ${keyword}`)
      return true
    }

    await supabase
      .from('vo_tasks')
      .update({ priority_locked: false, updated_at: new Date().toISOString() })
      .eq('id', found[0].id)

    await replyToLine(replyToken, `🔓 優先度ロックを解除しました\n\n${found[0].title}\n【${found[0].department}】\nAI 自動調整の対象に戻ります`)
    return true
  }

  return false
}

// タスク振り分け返信を処理
async function handleTaskAssignmentReply(text: string): Promise<boolean> {
  const trimmed = text.trim()

  // 「OK」で全タスク承認
  if (trimmed === 'OK' || trimmed === 'ok' || trimmed === 'ＯＫ') {
    // 翌日の未回答タスクを全てsuggested_typeのまま承認
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000
    const jstNow = new Date(now.getTime() + jstOffset)
    const tomorrow = new Date(jstNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: pending } = await supabase
      .from('vo_task_assignments')
      .select('*')
      .eq('task_date', tomorrow)
      .is('user_response', null)

    if (pending && pending.length > 0) {
      for (const task of pending) {
        await supabase
          .from('vo_task_assignments')
          .update({
            user_response: task.task_type || 'auto',
            responded_at: new Date().toISOString(),
          })
          .eq('id', task.id)
      }
      return true
    }
    return false
  }

  // 「番号 指示」形式（例: 「3 スキップ」「5 自動」「7 確認」）
  const match = trimmed.match(/^(\d+)\s*(自動|確認|スキップ)$/)
  if (match) {
    const taskNumber = parseInt(match[1])
    const instruction = match[2]

    const responseMap: Record<string, string> = {
      '自動': 'auto',
      '確認': 'confirm',
      'スキップ': 'skip',
    }

    // 翌日のタスクを番号順で取得
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000
    const jstNow = new Date(now.getTime() + jstOffset)
    const tomorrow = new Date(jstNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: tasks } = await supabase
      .from('vo_task_assignments')
      .select('*')
      .eq('task_date', tomorrow)
      .order('created_at', { ascending: true })

    if (tasks && tasks[taskNumber - 1]) {
      await supabase
        .from('vo_task_assignments')
        .update({
          user_response: responseMap[instruction] || 'auto',
          responded_at: new Date().toISOString(),
        })
        .eq('id', tasks[taskNumber - 1].id)
      return true
    }
    return false
  }

  // 複数行一括指示（例: 「1 自動\n3 スキップ\n5 確認」）
  const lines = trimmed.split('\n')
  let matched = false
  for (const line of lines) {
    const lineMatch = line.trim().match(/^(\d+)\s*(自動|確認|スキップ)$/)
    if (lineMatch) {
      // 再帰的に個別処理
      await handleTaskAssignmentReply(line.trim())
      matched = true
    }
  }
  if (matched) return true

  return false
}

// LINE Webhook - ユーザーからの返信をメモ保存 + タスク振り分け + タスク自動追加（返信なし）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events = body.events || []

    for (const event of events) {
      // テキストメッセージのみ処理
      if (event.type !== 'message' || event.message.type !== 'text') continue

      const text = event.message.text.trim()
      if (!text) continue

      // スレッズOKコマンド（Threads投稿一括承認 - 整体院のみ）
      if (text === 'スレッズOK' || text === 'スレッズok' || text === 'スレッズＯＫ') {
        const now = new Date()
        const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
        const today = jst.toISOString().slice(0, 10)
        const { data: updated, error } = await supabase
          .from('threads_scheduled_posts')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('date', today)
          .eq('status', 'pending')
          .or('account.eq.seitai,account.is.null')
          .select('id')
        if (error) {
          await replyToLine(event.replyToken, `Threads承認でエラーが発生しました: ${error.message}`)
        } else {
          const count = updated?.length || 0
          await replyToLine(event.replyToken, `✅ 整体院のThreads投稿 ${count}件を承認しました。\nスケジュール通りに自動投稿されます。`)
        }
        continue
      }

      // 訪問スレッズOKコマンド（Threads投稿一括承認 - 訪問鍼灸のみ）
      if (text === '訪問スレッズOK' || text === '訪問スレッズok' || text === '訪問スレッズＯＫ') {
        const now = new Date()
        const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
        const today = jst.toISOString().slice(0, 10)
        const { data: updated, error } = await supabase
          .from('threads_scheduled_posts')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('date', today)
          .eq('status', 'pending')
          .eq('account', 'houmon')
          .select('id')
        if (error) {
          await replyToLine(event.replyToken, `Threads承認でエラーが発生しました: ${error.message}`)
        } else {
          const count = updated?.length || 0
          await replyToLine(event.replyToken, `✅ 訪問鍼灸のThreads投稿 ${count}件を承認しました。\nスケジュール通りに自動投稿されます。`)
        }
        continue
      }

      // まず、タスク完了・一覧コマンドかチェック
      const isTaskStatus = await handleTaskStatusCommand(text, event.replyToken)
      if (isTaskStatus) continue

      // 定期タスクコマンドかチェック
      const isRecurring = await handleRecurringTaskCommand(text, event.replyToken)
      if (isRecurring) continue

      // タスク振り分け返信かチェック
      const isAssignment = await handleTaskAssignmentReply(text)
      if (isAssignment) continue

      // カテゴリ自動判別（先頭のキーワードで分類）
      let category: string = 'general'
      let content = text

      if (text.startsWith('方針:') || text.startsWith('方針：')) {
        category = 'direction'
        content = text.replace(/^方針[:：]\s*/, '')
      } else if (text.startsWith('気づき:') || text.startsWith('気づき：')) {
        category = 'insight'
        content = text.replace(/^気づき[:：]\s*/, '')
      } else if (text.startsWith('タスク:') || text.startsWith('タスク：')) {
        category = 'task'
        content = text.replace(/^タスク[:：]\s*/, '')
      } else if (text.startsWith('FB:') || text.startsWith('FB：')) {
        category = 'feedback'
        content = text.replace(/^FB[:：]\s*/, '')
      }

      // 部署タグ自動検出
      const deptKeywords: Record<string, string> = {
        '整体': '整体院事業部',
        '訪問': '訪問鍼灸事業部',
        'AI': 'AI開発部',
        'BtoB': 'BtoB営業部',
        'YouTube': 'メディア部',
        '動画': 'メディア部',
        'LP': 'LP・Web制作部',
        'SEO': 'LP・Web制作部',
        'デザイン': '動画・デザイン制作部',
        'チラシ': '動画・デザイン制作部',
        '財務': '財務部',
        '経理': '財務部',
        'リサーチ': 'リサーチ・ナレッジ部',
        '競合': 'リサーチ・ナレッジ部',
        'ヒアリング': 'リサーチ・ナレッジ部',
        'ナレッジ': 'リサーチ・ナレッジ部',
        'コンサル': 'コンサル事業部',
        '秘密基地': 'コンサル事業部',
        '機器': '治療機器販売部',
        'BR': '治療機器販売部',
        '血管': '治療機器販売部',
        '広告': '広告運用部',
        'Meta': '広告運用部',
      }

      const department_tags: string[] = []
      for (const [keyword, dept] of Object.entries(deptKeywords)) {
        if (content.includes(keyword) && !department_tags.includes(dept)) {
          department_tags.push(dept)
        }
      }

      // Supabaseにメモ保存
      await supabase.from('chairman_memos').insert({
        content,
        category,
        source: 'line',
        department_tags,
      })

      // タスクカテゴリの場合 → vo_tasksにも追加
      if (category === 'task') {
        const now = new Date()
        const jstOffset = 9 * 60 * 60 * 1000
        const jstNow = new Date(now.getTime() + jstOffset)
        const today = jstNow.toISOString().split('T')[0]

        const department = department_tags[0] || '経営層'

        // 担当区分のヒント検出: [CC] [自分] [両方]
        let assigneeType: 'cc' | 'ooguchi' | 'both' = 'cc'
        let taskContent = content
        const assigneeMatch = content.match(/^\[(CC|cc|自分|大口|両方|both)\]\s*(.+)$/)
        if (assigneeMatch) {
          const tag = assigneeMatch[1].toLowerCase()
          if (tag === '自分' || tag === '大口') assigneeType = 'ooguchi'
          else if (tag === '両方' || tag === 'both') assigneeType = 'both'
          else assigneeType = 'cc'
          taskContent = assigneeMatch[2].trim()
        } else {
          // デフォルト: 経営層/財務部のタスクは大口さんが判断
          if (department === '経営層' || department === '財務部') assigneeType = 'ooguchi'
        }

        await supabase.from('vo_tasks').insert({
          department,
          employee_name: null,
          title: taskContent.length > 25 ? taskContent.substring(0, 25) : taskContent,
          description: taskContent,
          priority: 'high',
          status: 'pending',
          due_date: today,
          batch_id: `line_${Date.now()}`,
          generated_by: 'line',
          assignee_type: assigneeType,
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('LINE Webhook error:', error)
    return NextResponse.json({ status: 'ok' })
  }
}

// LINE Webhook検証用（GET）
export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook is active' })
}

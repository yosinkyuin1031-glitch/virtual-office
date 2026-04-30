import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyTaskByUnit } from '../../lib/business-units'
import { suggestDestinations } from '../../lib/posting-destinations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'nodejs'

export interface InboxItem {
  id: string
  source: 'vo_task' | 'threads'
  title: string
  body: string
  preview: string
  employeeName: string | null
  department: string | null
  businessUnit: string
  priority: string | null
  createdAt: string
  action: 'pending' | 'posted' | 'archived'
  destinations: { key: string; label: string; url: string; emoji: string }[]
  meta?: Record<string, unknown>
}

// completion_noteから「【XX が自動実行】」と「--- 成果物 ---」を分離する
function parseCompletionNote(note: string): { summary: string; deliverable: string } {
  const deliverableMatch = note.match(/--- 成果物 ---\n?([\s\S]*)/)
  const deliverable = deliverableMatch ? deliverableMatch[1].trim() : note
  const summaryPart = deliverableMatch ? note.slice(0, deliverableMatch.index).trim() : ''
  return { summary: summaryPart, deliverable }
}

// GET /api/inbox?range=14
// 受信箱の統合一覧
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const days = Math.max(1, Math.min(60, Number(sp.get('range') || 14)))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // 1. vo_tasks: completion_noteがあるもの（AI社員が成果物を出したタスク）
    const { data: tasks, error: taskErr } = await supabase
      .from('vo_tasks')
      .select('id,department,title,description,priority,status,employee_name,completion_note,completed_at,created_at')
      .in('status', ['completed', 'posted', 'archived'])
      .not('completion_note', 'is', null)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })
      .limit(100)
    if (taskErr) throw taskErr

    // 2. threads_scheduled_posts: 投稿待ち or 承認待ち or 投稿済
    const sinceDate = since.slice(0, 10)
    const { data: threadsPosts, error: thErr } = await supabase
      .from('threads_scheduled_posts')
      .select('id,account,date,hour,text,status,updated_at,created_at')
      .gte('date', sinceDate)
      .in('status', ['pending', 'approved', 'posted'])
      .order('date', { ascending: false })
      .order('hour', { ascending: false })
      .limit(100)
    if (thErr) throw thErr

    const items: InboxItem[] = []

    // vo_tasksをinboxアイテムに変換
    for (const t of tasks ?? []) {
      const { deliverable } = parseCompletionNote(t.completion_note ?? '')
      const businessUnit = classifyTaskByUnit(t.department ?? '', t.title ?? '')
      const action: InboxItem['action'] =
        t.status === 'posted' ? 'posted' : t.status === 'archived' ? 'archived' : 'pending'
      const destinations = suggestDestinations({
        title: t.title ?? '',
        body: deliverable,
        department: t.department,
        businessUnit,
      })
      items.push({
        id: String(t.id),
        source: 'vo_task',
        title: t.title ?? '(無題)',
        body: deliverable,
        preview: deliverable.slice(0, 140),
        employeeName: t.employee_name ?? null,
        department: t.department ?? null,
        businessUnit,
        priority: t.priority ?? null,
        createdAt: t.completed_at ?? t.created_at,
        action,
        destinations,
        meta: { taskStatus: t.status },
      })
    }

    // threads_scheduled_postsをinboxアイテムに変換
    const accountToUnit: Record<string, string> = {
      seitai: '大口神経整体院',
      houmon: '晴陽鍼灸院',
      btob: 'アプリ事業',
    }
    const accountToDest: Record<string, string> = {
      seitai: 'threads_seitai',
      houmon: 'threads_houmon',
      btob: 'threads_btob',
    }
    for (const p of threadsPosts ?? []) {
      const businessUnit = accountToUnit[p.account] ?? '(不明)'
      const destKey = accountToDest[p.account] ?? 'threads_seitai'
      const destinations = suggestDestinations({
        title: 'Threads投稿',
        body: p.text ?? '',
        department: 'メディア部',
        businessUnit,
      })
      // 推定で出なかった場合のフォールバック
      if (destinations.length === 0) {
        const { DESTINATIONS } = await import('../../lib/posting-destinations')
        if (DESTINATIONS[destKey]) destinations.push(DESTINATIONS[destKey])
      }
      const action: InboxItem['action'] = p.status === 'posted' ? 'posted' : 'pending'
      const dateStr = `${p.date}T${String(p.hour ?? 0).padStart(2, '0')}:00:00+09:00`
      items.push({
        id: String(p.id),
        source: 'threads',
        title: `Threads ${p.account} ${p.date} ${p.hour ?? 0}時`,
        body: p.text ?? '',
        preview: (p.text ?? '').slice(0, 140),
        employeeName: null,
        department: 'メディア部',
        businessUnit,
        priority: p.status === 'approved' ? 'high' : 'normal',
        createdAt: dateStr,
        action,
        destinations,
        meta: { account: p.account, threadsStatus: p.status },
      })
    }

    // 新しい順にソート
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    // サマリー
    const summary = {
      total: items.length,
      pending: items.filter((i) => i.action === 'pending').length,
      posted: items.filter((i) => i.action === 'posted').length,
      archived: items.filter((i) => i.action === 'archived').length,
      byUnit: items.reduce<Record<string, number>>((acc, i) => {
        if (i.action !== 'pending') return acc
        acc[i.businessUnit] = (acc[i.businessUnit] ?? 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ items, summary })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/inbox
// body: { source: 'vo_task' | 'threads', id: string, action: 'posted' | 'archived' | 'reset' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source, id, action } = body as { source: string; id: string; action: string }
    if (!source || !id || !action) {
      return NextResponse.json({ error: 'source/id/action required' }, { status: 400 })
    }

    if (source === 'vo_task') {
      const newStatus =
        action === 'posted' ? 'posted' : action === 'archived' ? 'archived' : 'completed'
      const { error } = await supabase
        .from('vo_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ ok: true, source, id, action: newStatus })
    }

    if (source === 'threads') {
      // threads_scheduled_postsには'archived'がない設計なのでpostedとpendingのみ受け付け
      const newStatus =
        action === 'posted' ? 'posted' : action === 'archived' ? 'pending' : 'pending'
      const { error } = await supabase
        .from('threads_scheduled_posts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ ok: true, source, id, action: newStatus })
    }

    return NextResponse.json({ error: 'unknown source' }, { status: 400 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

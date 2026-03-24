import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzkfkazjylrkspqrnhnx.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ChairmanMemo {
  id: string
  content: string
  category: 'direction' | 'insight' | 'task' | 'feedback' | 'general'
  source: 'web' | 'line' | 'voice'
  department_tags: string[]
  created_at: string
  updated_at: string
}

// カテゴリラベル
export const memoCategories: Record<ChairmanMemo['category'], { label: string; icon: string; color: string }> = {
  direction: { label: '方針・判断', icon: '🧭', color: '#FFD700' },
  insight: { label: '気づき', icon: '💡', color: '#22D3EE' },
  task: { label: 'タスク', icon: '📋', color: '#22C55E' },
  feedback: { label: 'フィードバック', icon: '📝', color: '#F59E0B' },
  general: { label: 'その他', icon: '💬', color: '#A78BFA' },
}

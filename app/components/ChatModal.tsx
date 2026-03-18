'use client'

import { useState, useRef, useEffect } from 'react'
import type { Employee } from '../lib/data'
import PixelCharacter from './PixelCharacter'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatModalProps {
  employee: Employee
  onClose: () => void
}

export default function ChatModal({ employee, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ローカルストレージから履歴読み込み
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${employee.id}`)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch {}
    }
  }, [employee.id])

  // 履歴保存
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${employee.id}`, JSON.stringify(messages.slice(-50)))
    }
  }, [messages, employee.id])

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // 初回フォーカス
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          employeeName: employee.name,
          employeeRole: employee.role,
          department: employee.department,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.error || 'エラーが発生しました',
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '通信エラーが発生しました。もう一度お試しください。',
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem(`chat_${employee.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* チャットパネル */}
      <div className="relative w-full sm:max-w-lg h-[85vh] sm:h-[70vh] bg-[#0a0f1a] border border-gray-700 sm:rounded-xl overflow-hidden flex flex-col rounded-t-xl">
        {/* ヘッダー */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-800"
          style={{ backgroundColor: employee.color + '15' }}
        >
          <PixelCharacter name={employee.name} color={employee.color} status={employee.status} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: employee.color }}>
                {employee.name}
              </span>
              <span className="text-[10px] text-gray-500">{employee.department}</span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">{employee.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="text-[10px] text-gray-600 hover:text-gray-400 px-2 py-1 rounded border border-gray-800 hover:border-gray-600 transition"
            >
              履歴クリア
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xl px-2 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <PixelCharacter name={employee.name} color={employee.color} status={employee.status} size={64} />
              </div>
              <p className="text-sm" style={{ color: employee.color }}>
                【{employee.name}】に指示を出す
              </p>
              <p className="text-xs text-gray-500 mt-1">{employee.currentTask}</p>
              <div className="mt-4 space-y-2">
                {getSuggestions(employee.department).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-800 transition"
                  >
                    💬 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-cyan-900/40 border border-cyan-800/50 text-cyan-100'
                  : 'bg-gray-900/80 border border-gray-800 text-gray-200'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold" style={{ color: employee.color }}>
                      {employee.name}
                    </span>
                    <span className="text-[9px] text-gray-600">{msg.timestamp}</span>
                  </div>
                )}
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'user' && (
                  <p className="text-[9px] text-cyan-600 text-right mt-0.5">{msg.timestamp}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: employee.color }}>{employee.name}</span>
                  <span className="text-xs text-gray-500 animate-pulse">入力中...</span>
                </div>
                <div className="flex gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="border-t border-gray-800 px-3 py-3 bg-[#060b14]">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${employee.name}に指示を出す...`}
              rows={1}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-700 transition max-h-24"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-700 hover:bg-cyan-600 text-white"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 部署別のサジェスチョン
function getSuggestions(department: string): string[] {
  const map: Record<string, string[]> = {
    '経営層': ['今日やるべきことを整理して', '1,500万戦略の進捗を報告して', '全社の課題を3つ挙げて'],
    '財務部': ['今月の収支を整理して', 'Stripe本番化の手順を教えて', '来月のキャッシュフロー予測を出して'],
    '整体院事業部': ['GBP投稿を3本作って', 'LINE配信の文面を作って', 'Instagram投稿のネタを5つ出して'],
    '訪問鍼灸事業部': ['ケアマネ向け営業資料を作って', 'Instagram投稿のネタを5つ出して', '新規営業先のリストを作って'],
    'AI開発部': ['BtoB販売の営業資料を作って', '次に開発すべき機能は？', '検査アプリクラウド化の進捗は？'],
    'メディア部': ['YouTube投稿のタイトル案を出して', 'サムネイル改善案を出して', '次の動画テーマを提案して'],
  }
  return map[department] || ['現在の業務進捗を報告して', '改善提案を出して', '来月の計画を立てて']
}

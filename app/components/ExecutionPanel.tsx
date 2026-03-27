'use client'

import { useState, useRef, useCallback } from 'react'

interface EmployeeResult {
  employee: string
  employeeId: string
  department: string
  status: 'waiting' | 'executing' | 'completed' | 'error'
  result?: string
  error?: string
  progress?: string
}

interface AnalysisData {
  departments: string[]
  employees: string[]
  taskType: string
}

interface ExecutionSummary {
  total: number
  completed: number
  errors: number
}

export default function ExecutionPanel() {
  const [goal, setGoal] = useState('')
  const [mode, setMode] = useState<'parallel' | 'sequential'>('parallel')
  const [isExecuting, setIsExecuting] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [employeeResults, setEmployeeResults] = useState<Record<string, EmployeeResult>>({})
  const [summary, setSummary] = useState<ExecutionSummary | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const toggleCard = useCallback((employeeId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(employeeId)) {
        next.delete(employeeId)
      } else {
        next.add(employeeId)
      }
      return next
    })
  }, [])

  const handleExecute = async () => {
    if (!goal.trim() || isExecuting) return

    setIsExecuting(true)
    setAnalysis(null)
    setEmployeeResults({})
    setSummary(null)
    setExpandedCards(new Set())
    setError(null)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), mode }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'APIエラーが発生しました')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('ストリームの取得に失敗しました')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            handleSSEEvent(data)
          } catch {
            // JSONパースエラーは無視
          }
        }
      }

      // 残りのバッファを処理
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6))
          handleSSEEvent(data)
        } catch {
          // 無視
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('実行がキャンセルされました')
      } else {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
      }
    } finally {
      setIsExecuting(false)
      abortRef.current = null
    }
  }

  const handleSSEEvent = (data: Record<string, unknown>) => {
    switch (data.type) {
      case 'analysis':
        setAnalysis({
          departments: data.departments as string[],
          employees: data.employees as string[],
          taskType: data.taskType as string,
        })
        break

      case 'progress':
        setEmployeeResults(prev => ({
          ...prev,
          [data.employeeId as string]: {
            employee: data.employee as string,
            employeeId: data.employeeId as string,
            department: data.department as string,
            status: 'executing',
            progress: data.progress as string,
          },
        }))
        break

      case 'result':
        setEmployeeResults(prev => ({
          ...prev,
          [data.employeeId as string]: {
            employee: data.employee as string,
            employeeId: data.employeeId as string,
            department: data.department as string,
            status: 'completed',
            result: data.result as string,
          },
        }))
        // 自動展開
        setExpandedCards(prev => {
          const next = new Set(prev)
          next.add(data.employeeId as string)
          return next
        })
        break

      case 'error':
        setEmployeeResults(prev => ({
          ...prev,
          [data.employeeId as string]: {
            employee: data.employee as string,
            employeeId: data.employeeId as string,
            department: data.department as string,
            status: 'error',
            error: data.error as string,
          },
        }))
        break

      case 'done':
        setSummary(data.summary as ExecutionSummary)
        break

      case 'fatal-error':
        setError(data.error as string)
        break
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'executing': return '🔄'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#888'
      case 'executing': return '#FFD700'
      case 'completed': return '#22C55E'
      case 'error': return '#EF4444'
      default: return '#888'
    }
  }

  const departmentColor = (dept: string): string => {
    const colors: Record<string, string> = {
      '経営層': '#FFD700',
      '財務部': '#00C853',
      '整体院事業部': '#1565C0',
      '訪問鍼灸事業部': '#2E7D32',
      'AI開発部': '#263238',
      'メディア部': '#311B92',
      'LP・Web制作部': '#E91E63',
      'BtoB営業部': '#FF6F00',
      'プロダクト管理部': '#FF7043',
      'カスタマーサクセス部': '#26C6DA',
      '動画・デザイン制作部': '#00BCD4',
    }
    return colors[dept] || '#666'
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans JP", sans-serif',
    }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '22px' }}>⚡</span>
          AI社員 一斉実行パネル
        </h2>
        <p style={{ color: '#888', fontSize: '12px' }}>
          ゴールを入力すると、関連部署のAI社員がClaude APIで並列タスク実行します
        </p>
      </div>

      {/* ゴール入力 */}
      <div style={{ marginBottom: '16px' }}>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例: 来月のFacebook投稿を5本作成して"
          disabled={isExecuting}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '12px',
            color: '#fff',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleExecute()
            }
          }}
        />
      </div>

      {/* 実行モードと実行ボタン */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('parallel')}
            disabled={isExecuting}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              background: mode === 'parallel' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)',
              color: mode === 'parallel' ? '#FFD700' : '#888',
              fontWeight: mode === 'parallel' ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            並列実行
          </button>
          <button
            onClick={() => setMode('sequential')}
            disabled={isExecuting}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              background: mode === 'sequential' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)',
              color: mode === 'sequential' ? '#FFD700' : '#888',
              fontWeight: mode === 'sequential' ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            順次実行
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {isExecuting ? (
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            キャンセル
          </button>
        ) : (
          <button
            onClick={handleExecute}
            disabled={!goal.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: goal.trim()
                ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                : 'rgba(255,255,255,0.1)',
              color: goal.trim() ? '#000' : '#555',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: goal.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            ⚡ 一斉実行
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#EF4444',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* 解析結果 */}
      {analysis && (
        <div style={{
          background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '12px', color: '#FFD700', marginBottom: '6px', fontWeight: 'bold' }}>
            ゴール解析結果
          </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            <span style={{ marginRight: '16px' }}>
              担当部署: {analysis.departments.map(d => (
                <span key={d} style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${departmentColor(d)}33`,
                  color: departmentColor(d),
                  fontSize: '11px',
                  marginLeft: '4px',
                  marginBottom: '2px',
                }}>
                  {d}
                </span>
              ))}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
            担当社員: {analysis.employees.join('、')} ({analysis.employees.length}名)
            <span style={{ marginLeft: '12px', color: '#888' }}>
              タスク種別: {analysis.taskType}
            </span>
          </div>
        </div>
      )}

      {/* 実行結果カード */}
      {Object.keys(employeeResults).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.values(employeeResults).map((result) => (
            <div
              key={result.employeeId}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${statusColor(result.status)}33`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.3s',
              }}
            >
              {/* カードヘッダー */}
              <div
                onClick={() => result.status !== 'executing' && toggleCard(result.employeeId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  cursor: result.status !== 'executing' ? 'pointer' : 'default',
                  borderBottom: expandedCards.has(result.employeeId) ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: '16px' }}>{statusIcon(result.status)}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${departmentColor(result.department)}33`,
                  color: departmentColor(result.department),
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}>
                  {result.department}
                </span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                  {result.employee}
                </span>
                <span style={{
                  color: statusColor(result.status),
                  fontSize: '12px',
                  marginLeft: 'auto',
                }}>
                  {result.status === 'executing' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="spin" style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderTopColor: '#FFD700',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      実行中
                    </span>
                  )}
                  {result.status === 'completed' && '完了'}
                  {result.status === 'error' && 'エラー'}
                </span>
                {result.status !== 'executing' && (
                  <span style={{ color: '#666', fontSize: '14px', marginLeft: '4px' }}>
                    {expandedCards.has(result.employeeId) ? '▲' : '▼'}
                  </span>
                )}
              </div>

              {/* カードボディ（展開時） */}
              {expandedCards.has(result.employeeId) && (
                <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                  {result.status === 'completed' && result.result && (
                    <div style={{
                      color: '#ddd',
                      fontSize: '13px',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {result.result}
                    </div>
                  )}
                  {result.status === 'error' && result.error && (
                    <div style={{
                      color: '#EF4444',
                      fontSize: '13px',
                    }}>
                      {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* サマリー */}
      {summary && (
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <div style={{ fontSize: '13px', color: '#ccc' }}>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>実行完了</span>
            <span style={{ marginLeft: '12px' }}>
              全{summary.total}名 / 完了{summary.completed}名
              {summary.errors > 0 && (
                <span style={{ color: '#EF4444', marginLeft: '8px' }}>
                  エラー{summary.errors}名
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* スピンアニメーション用CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeGoal } from '../../lib/goal-analyzer';
import { supabase } from '../../lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'nodejs';
export const maxDuration = 120;

interface ExecuteRequest {
  goal: string;
  mode?: 'parallel' | 'sequential';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { goal, mode = 'parallel' } = body;

    if (!goal || goal.trim() === '') {
      return new Response(JSON.stringify({ error: 'ゴールを入力してください' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY が設定されていません' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ゴール解析
    const analysis = analyzeGoal(goal);

    // SSEストリーム作成
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // 解析結果を送信
        sendEvent({
          type: 'analysis',
          goal,
          departments: analysis.departments,
          employees: analysis.employees,
          taskType: analysis.taskType,
        });

        const results: Record<string, { employee: string; department: string; status: string; result?: string; error?: string }> = {};

        // 各社員のタスクを実行
        const executeTask = async (prompt: typeof analysis.employeePrompts[0]) => {
          const taskDescription = analysis.taskDescriptions[prompt.id];

          // 実行開始イベント
          sendEvent({
            type: 'progress',
            department: prompt.department,
            employee: prompt.name,
            employeeId: prompt.id,
            status: 'executing',
            progress: `${prompt.name}がタスクを実行中...`,
          });

          try {
            const message = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 2048,
              system: prompt.systemPrompt,
              messages: [{ role: 'user', content: taskDescription }],
            });

            const resultText = message.content
              .filter((block): block is Anthropic.TextBlock => block.type === 'text')
              .map(block => block.text)
              .join('\n');

            results[prompt.id] = {
              employee: prompt.name,
              department: prompt.department,
              status: 'completed',
              result: resultText,
            };

            // 完了イベント
            sendEvent({
              type: 'result',
              department: prompt.department,
              employee: prompt.name,
              employeeId: prompt.id,
              status: 'completed',
              result: resultText,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラー';

            results[prompt.id] = {
              employee: prompt.name,
              department: prompt.department,
              status: 'error',
              error: errorMessage,
            };

            // エラーイベント（他の社員は止めない）
            sendEvent({
              type: 'error',
              department: prompt.department,
              employee: prompt.name,
              employeeId: prompt.id,
              status: 'error',
              error: errorMessage,
            });
          }
        };

        try {
          if (mode === 'parallel') {
            // 並列実行
            await Promise.all(analysis.employeePrompts.map(prompt => executeTask(prompt)));
          } else {
            // 順次実行
            for (const prompt of analysis.employeePrompts) {
              await executeTask(prompt);
            }
          }

          // 実行ログをSupabaseに保存（エラーでも止めない）
          try {
            await supabase.from('vo_execution_logs').insert({
              goal,
              departments: analysis.departments,
              employees: analysis.employees,
              task_type: analysis.taskType,
              mode,
              status: Object.values(results).every(r => r.status === 'completed') ? 'completed' : 'partial',
              results,
            });
          } catch {
            // ログ保存失敗は無視
          }

          // 完了イベント
          sendEvent({
            type: 'done',
            status: 'completed',
            summary: {
              total: analysis.employeePrompts.length,
              completed: Object.values(results).filter(r => r.status === 'completed').length,
              errors: Object.values(results).filter(r => r.status === 'error').length,
            },
          });
        } catch (error) {
          sendEvent({
            type: 'fatal-error',
            error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'リクエストの処理に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

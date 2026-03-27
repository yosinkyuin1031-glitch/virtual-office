import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// 実行ログ取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data, error, count } = await supabase
      .from('vo_execution_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 実行ログ保存（手動保存用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('vo_execution_logs')
      .insert({
        goal: body.goal,
        departments: body.departments || [],
        employees: body.employees || [],
        task_type: body.task_type || 'general',
        mode: body.mode || 'parallel',
        status: body.status || 'completed',
        results: body.results || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存に失敗しました' },
      { status: 500 }
    );
  }
}

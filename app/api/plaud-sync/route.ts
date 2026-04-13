import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabase } from '../../lib/supabase'
import { verifyCronAuth, logActivity } from '../../lib/pdca-utils'
import {
  detectCategory,
  detectDepartmentTags,
  detectBusinessTags,
} from '../../lib/memo-utils'

// Google Drive APIクライアントを初期化
function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !privateKey) {
    throw new Error('Google Service Account の環境変数が未設定です')
  }

  const auth = new google.auth.JWT({
    email,
    // Vercel環境変数では \n がリテラルになるため置換
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return google.drive({ version: 'v3', auth })
}

// Plaudフォルダ内のTXTファイル一覧を取得
async function listPlaudFiles(drive: ReturnType<typeof google.drive>) {
  const folderId = process.env.GOOGLE_DRIVE_PLAUD_FOLDER_ID
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_PLAUD_FOLDER_ID が未設定です')
  }

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='text/plain' and trashed=false`,
    fields: 'files(id, name, createdTime, modifiedTime)',
    orderBy: 'createdTime desc',
    pageSize: 50,
  })

  return res.data.files || []
}

// ファイル内容を読み取り
async function readFileContent(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<string> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  )
  return String(res.data)
}

// 処理済みファイルIDの一覧を取得
async function getSyncedFileIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('plaud_synced_files')
    .select('drive_file_id')

  if (error) {
    console.error('plaud_synced_files 取得エラー:', error.message)
    return new Set()
  }

  return new Set((data || []).map((r: { drive_file_id: string }) => r.drive_file_id))
}

// メモを保存し、必要なら company_context へ昇格
async function processMemo(
  content: string,
  fileName: string
): Promise<{ memoId: string; category: string; promoted: boolean }> {
  const { category, cleaned } = detectCategory(content)
  const department_tags = detectDepartmentTags(cleaned)
  const business_tags = detectBusinessTags(cleaned)

  // chairman_memos に保存
  const { data: memo, error: memoError } = await supabase
    .from('chairman_memos')
    .insert({
      content: cleaned,
      category,
      source: 'plaud',
      department_tags,
    })
    .select()
    .single()

  if (memoError || !memo) {
    throw new Error(`chairman_memos 保存失敗: ${memoError?.message}`)
  }

  // direction / insight なら company_context へ昇格
  let promoted = false
  if (category === 'direction' || category === 'insight') {
    const { error: ctxError } = await supabase.from('company_context').insert({
      title: fileName.replace(/\.txt$/i, '').slice(0, 50) || cleaned.slice(0, 50),
      content: cleaned,
      category,
      department_tags,
      business_tags,
      source: 'plaud',
      source_memo_id: memo.id,
    })
    if (!ctxError) {
      promoted = true
      await supabase
        .from('chairman_memos')
        .update({ promoted_to_context: true })
        .eq('id', memo.id)
    }
  }

  return { memoId: memo.id, category, promoted }
}

// 同期済みファイルを記録
async function markSynced(
  driveFileId: string,
  fileName: string,
  memoId: string,
  contentPreview: string
) {
  const { error } = await supabase.from('plaud_synced_files').insert({
    drive_file_id: driveFileId,
    file_name: fileName,
    memo_id: memoId,
    content_preview: contentPreview.slice(0, 200),
  })
  if (error) {
    console.error(`plaud_synced_files 記録エラー (${driveFileId}):`, error.message)
  }
}

// GET: cron呼び出し用エンドポイント
export async function GET(request: NextRequest) {
  // CRON_SECRET認証
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const drive = getDriveClient()
    const files = await listPlaudFiles(drive)
    const syncedIds = await getSyncedFileIds()

    // 未処理ファイルをフィルタ
    const newFiles = files.filter((f) => f.id && !syncedIds.has(f.id))

    if (newFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: '新しいファイルはありません',
        total_in_folder: files.length,
        already_synced: syncedIds.size,
      })
    }

    const results: Array<{
      file_name: string
      memo_id: string
      category: string
      promoted: boolean
    }> = []
    const errors: Array<{ file_name: string; error: string }> = []

    for (const file of newFiles) {
      if (!file.id || !file.name) continue

      try {
        // ファイル内容を読み取り
        const content = await readFileContent(drive, file.id)
        if (!content.trim()) {
          errors.push({ file_name: file.name, error: '空ファイル' })
          continue
        }

        // メモとして処理・保存
        const { memoId, category, promoted } = await processMemo(content, file.name)

        // 同期済みとして記録
        await markSynced(file.id, file.name, memoId, content)

        results.push({
          file_name: file.name,
          memo_id: memoId,
          category,
          promoted,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push({ file_name: file.name, error: msg })
        console.error(`Plaud sync エラー (${file.name}):`, msg)
      }
    }

    // 活動ログに記録
    if (results.length > 0) {
      await logActivity(
        'CC-PlaudSync',
        'AI開発部',
        'plaud_sync',
        `Plaud ${results.length}件同期完了: ${results.map((r) => r.file_name).join(', ')}`
      )
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      errors: errors.length,
      results,
      error_details: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Plaud sync 全体エラー:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY_ID

const R2_BUCKET = 'edlide-course'
const EXPIRES_IN_SECONDS = Number.parseInt(process.env.R2_VIDEO_URL_EXPIRES_SECONDS ?? '900', 10)

const TOPIC_FILE_MAP: Record<string, string> = {
  'topic-1-1-1': '1-module-1-lesson/Что такое Вайбкодинг(1).mp4',
  'topic-1-1-2': '1-module-1-lesson/Отличие Edlide и ChatGPT (2).mp4',
  'topic-1-1-3': '1-module-1-lesson/Настройка Edlide. Базовое понимание mcp, rules, autoaccept логики(3).mp4',
  'topic-1-1-4': '1-module-1-lesson/Отличие между Project rules и System Prompt(4).mp4',
  'topic-1-1-5': '1-module-1-lesson/Логика PRD документа, Создаем первый сайт на Next.js (5).mp4',
}

export async function GET(request: NextRequest) {
  try {
    const topicId = request.nextUrl.searchParams.get('topicId')
    if (!topicId || !TOPIC_FILE_MAP[topicId]) {
      return NextResponse.json({ error: 'Invalid topicId' }, { status: 400 })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authentication' }, { status: 401 })
    }

    const userToken = authHeader.substring(7)
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user } } = await authSupabase.auth.getUser(userToken)

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: accessRow } = await adminSupabase
      .from('education_access')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!accessRow) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      return NextResponse.json({ error: 'R2 credentials not configured' }, { status: 500 })
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    })

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: TOPIC_FILE_MAP[topicId],
    })

    const url = await getSignedUrl(s3, command, {
      expiresIn: Number.isNaN(EXPIRES_IN_SECONDS) ? 900 : EXPIRES_IN_SECONDS,
    })

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Code and userId are required' },
        { status: 400 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: codeRow, error: codeError } = await adminSupabase
      .from('education_codes')
      .select('id, code, used_by')
      .eq('code', code.trim())
      .single()

    if (codeError || !codeRow) {
      return NextResponse.json(
        { error: 'Invalid activation code' },
        { status: 404 }
      )
    }

    if (codeRow.used_by) {
      return NextResponse.json(
        { error: 'This activation code has already been used' },
        { status: 400 }
      )
    }

    const { data: existingAccess } = await adminSupabase
      .from('education_access')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Education portal is already activated for this account' },
        { status: 400 }
      )
    }

    const { error: updateCodeError } = await adminSupabase
      .from('education_codes')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('id', codeRow.id)

    if (updateCodeError) {
      return NextResponse.json(
        { error: 'Failed to activate code' },
        { status: 500 }
      )
    }

    const { error: insertAccessError } = await adminSupabase
      .from('education_access')
      .insert({
        user_id: userId,
        activated_by_code: code.trim(),
      })

    if (insertAccessError) {
      await adminSupabase
        .from('education_codes')
        .update({ used_by: null, used_at: null })
        .eq('id', codeRow.id)

      return NextResponse.json(
        { error: 'Failed to activate education access' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/admin/ban-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, reason, bannedBy } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_status')
      .upsert({
        user_id: userId,
        status: 'banned',
        ban_reason: reason,
        banned_by: bannedBy || 'admin',
        banned_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User banned successfully' 
    })
  } catch (error) {
    console.error('User ban error:', error)
    return NextResponse.json(
      { error: 'Failed to ban user' }, 
      { status: 500 }
    )
  }
}
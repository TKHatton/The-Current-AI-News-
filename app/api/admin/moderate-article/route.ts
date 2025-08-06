// app/api/admin/moderate-article/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { articleId, action, reason } = await request.json()

    if (!articleId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const status = action === 'approve' ? 'published' : 'archived'
    const updateData: any = { status }

    if (action === 'archive') {
      updateData.archived_at = new Date().toISOString()
      updateData.archive_reason = reason || 'Admin moderation'
    }

    const { error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: `Article ${action}d successfully` 
    })
  } catch (error) {
    console.error('Article moderation error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate article' }, 
      { status: 500 }
    )
  }
}
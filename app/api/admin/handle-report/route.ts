// app/api/admin/handle-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { reportId, action, reviewerId } = await request.json()

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const status = action === 'resolve' ? 'resolved' : 'dismissed'
    const actionTaken = action === 'resolve' ? 'comment_hidden' : 'no_action'

    const { error } = await supabase
      .from('comment_reports')
      .update({
        status,
        reviewed_by: reviewerId || 'admin',
        reviewed_at: new Date().toISOString(),
        action_taken: actionTaken
      })
      .eq('id', reportId)

    if (error) {
      throw error
    }

    // If resolving, also hide the reported comment
    if (action === 'resolve') {
      const { data: report } = await supabase
        .from('comment_reports')
        .select('comment_id')
        .eq('id', reportId)
        .single()

      if (report) {
        await supabase
          .from('article_comments')
          .update({
            status: 'hidden',
            moderated_by: reviewerId || 'admin',
            moderated_at: new Date().toISOString()
          })
          .eq('id', report.comment_id)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Report ${action}d successfully` 
    })
  } catch (error) {
    console.error('Report handling error:', error)
    return NextResponse.json(
      { error: 'Failed to handle report' }, 
      { status: 500 }
    )
  }
}
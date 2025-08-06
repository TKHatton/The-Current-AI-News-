// app/api/admin/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all stats in parallel for better performance
    const [
      articlesResult,
      usersResult, 
      commentsResult,
      reportsResult,
      todayArticlesResult
    ] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('article_comments').select('*', { count: 'exact', head: true }),
      supabase.from('comment_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00')
    ])

    const stats = {
      totalArticles: articlesResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalComments: commentsResult.count || 0,
      pendingReports: reportsResult.count || 0,
      todayArticles: todayArticlesResult.count || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' }, 
      { status: 500 }
    )
  }
}
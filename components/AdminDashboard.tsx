// components/AdminDashboard.tsx
// Move the existing AdminDashboard component here
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Users, 
  FileText, 
  MessageSquare,
  RefreshCw,
  Ban,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react'

interface Article {
  id: string
  title: string
  excerpt: string
  author: string
  source_url: string
  industry_category: string
  published_at: string
  status: string
  view_count: number
  star_count: number
  comment_count: number
  tags: string[]
  global_perspective_score: number
}

interface User {
  id: string
  full_name: string
  created_at: string
  total_articles_read: number
  comment_count: number
  reputation_score: number
  status: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  status: string
  like_count: number
  article_title: string
  user_name: string
  toxicity_score: number
}

interface Report {
  id: string
  comment_id: string
  report_reason: string
  report_details: string
  status: string
  created_at: string
  comment_content: string
  reporter_name: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [articles, setArticles] = useState<Article[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalUsers: 0,
    totalComments: 0,
    pendingReports: 0,
    todayArticles: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load stats
      const [articlesCount, usersCount, commentsCount, reportsCount] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('article_comments').select('*', { count: 'exact', head: true }),
        supabase.from('comment_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      // Today's articles
      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)

      setStats({
        totalArticles: articlesCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalComments: commentsCount.count || 0,
        pendingReports: reportsCount.count || 0,
        todayArticles: todayCount || 0
      })

      // Load recent data for each tab
      await loadArticles()
      await loadUsers()
      await loadComments()
      await loadReports()
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const loadArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    setArticles(data || [])
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_status(status)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setUsers(data || [])
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('article_comments')
      .select(`
        *,
        articles(title),
        user_profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setComments(data || [])
  }

  const loadReports = async () => {
    const { data } = await supabase
      .from('comment_reports')
      .select(`
        *,
        article_comments(content),
        user_profiles(full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setReports(data || [])
  }

  const refreshContent = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/refresh-content', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Content refresh initiated")
        await loadDashboardData()
      } else {
        throw new Error(data.error || 'Failed to refresh content')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh content")
    } finally {
      setLoading(false)
    }
  }

  const moderateArticle = async (articleId: string, action: 'approve' | 'archive') => {
    try {
      const response = await fetch('/api/admin/moderate-article', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          articleId, 
          action,
          reason: action === 'archive' ? 'Admin moderation' : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Article ${action}d successfully`)
        await loadArticles()
      } else {
        throw new Error(data.error || 'Failed to moderate article')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to moderate article")
    }
  }

  const moderateComment = async (commentId: string, action: 'approve' | 'hide') => {
    try {
      const response = await fetch('/api/admin/moderate-comment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          commentId, 
          action,
          moderatorId: 'admin'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Comment ${action}d successfully`)
        await loadComments()
      } else {
        throw new Error(data.error || 'Failed to moderate comment')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to moderate comment")
    }
  }

  const handleReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const response = await fetch('/api/admin/handle-report', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reportId, 
          action,
          reviewerId: 'admin'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Report ${action}d successfully`)
        await loadReports()
      } else {
        throw new Error(data.error || 'Failed to handle report')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to handle report")
    }
  }

  const banUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId, 
          reason,
          bannedBy: 'admin'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("User banned successfully")
        await loadUsers()
      } else {
        throw new Error(data.error || 'Failed to ban user')
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to ban user")
    }
  }

  const TabButton = ({ id, icon: Icon, label, count }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
      {count > 0 && (
        <Badge variant="secondary" className="ml-1 text-xs">
          {count}
        </Badge>
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">The Current - Content Management</p>
          </div>
          <Button 
            onClick={refreshContent} 
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-blue-500"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Content
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Articles</p>
                  <p className="text-2xl font-bold">{stats.totalArticles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Today's Articles</p>
                  <p className="text-2xl font-bold">{stats.todayArticles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Comments</p>
                  <p className="text-2xl font-bold">{stats.totalComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Pending Reports</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton id="overview" icon={Eye} label="Overview" count={0} />
          <TabButton id="articles" icon={FileText} label="Articles" count={articles.length} />
          <TabButton id="users" icon={Users} label="Users" count={users.length} />
          <TabButton id="comments" icon={MessageSquare} label="Comments" count={comments.length} />
          <TabButton id="reports" icon={AlertTriangle} label="Reports" count={stats.pendingReports} />
        </div>

        {/* Content Area */}
        {activeTab === 'articles' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Recent Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articles.map((article) => (
                  <div key={article.id} className="flex justify-between items-start p-4 border border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{article.excerpt}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By {article.author}</span>
                        <span>{article.industry_category}</span>
                        <span>{article.view_count} views</span>
                        <span>{article.star_count} stars</span>
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                          {article.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderateArticle(article.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => moderateArticle(article.id, 'archive')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {report.report_reason}
                        </Badge>
                        <p className="text-sm text-gray-400">
                          Reported by {report.reporter_name} • {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReport(report.id, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReport(report.id, 'resolve')}
                        >
                          Resolve & Hide
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border-l-4 border-red-500">
                      <p className="text-sm">{report.comment_content}</p>
                    </div>
                    {report.report_details && (
                      <div className="mt-2 text-sm text-gray-400">
                        <strong>Details:</strong> {report.report_details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
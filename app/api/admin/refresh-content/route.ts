// app/api/admin/refresh-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SoftLaunchContentManager } from '@/lib/content-pipeline'

export async function POST(request: NextRequest) {
  try {
    // Add basic auth check here if needed
    // const session = await getServerSession()
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const manager = new SoftLaunchContentManager()
    await manager.refreshContent()

    return NextResponse.json({ 
      success: true, 
      message: 'Content refresh initiated successfully' 
    })
  } catch (error) {
    console.error('Content refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh content' }, 
      { status: 500 }
    )
  }
}
// app/api/admin/seed-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SoftLaunchContentManager } from '@/lib/content-pipeline'

export async function POST(request: NextRequest) {
  try {
    const manager = new SoftLaunchContentManager()
    await manager.seedInitialContent()

    return NextResponse.json({ 
      success: true, 
      message: 'Initial content seeded successfully' 
    })
  } catch (error) {
    console.error('Content seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed content' }, 
      { status: 500 }
    )
  }
}
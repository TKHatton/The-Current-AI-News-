// app/admin/setup/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { RefreshCw, Database, CheckCircle } from 'lucide-react'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  const setupSteps = [
    {
      title: "Seed Initial Content",
      description: "Populate database with AI news articles",
      action: async () => {
        const response = await fetch('/api/admin/seed-content', { method: 'POST' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        return "Initial content seeded successfully"
      }
    },
    {
      title: "Test Content Pipeline", 
      description: "Verify automated content fetching works",
      action: async () => {
        const response = await fetch('/api/admin/refresh-content', { method: 'POST' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        return "Content pipeline tested successfully"
      }
    },
    {
      title: "Verify Database",
      description: "Check that articles were created properly",
      action: async () => {
        const response = await fetch('/api/admin/dashboard-stats')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        if (data.totalArticles === 0) throw new Error("No articles found")
        return `Found ${data.totalArticles} articles in database`
      }
    }
  ]

  const runSetup = async () => {
    setLoading(true)
    
    for (let i = 0; i < setupSteps.length; i++) {
      setStep(i)
      try {
        const result = await setupSteps[i].action()
        toast.success(result)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Brief pause
      } catch (error: any) {
        toast.error(`Step ${i + 1} failed: ${error.message}`)
        setLoading(false)
        return
      }
    }
    
    setStep(setupSteps.length)
    setLoading(false)
    toast.success("🎉 Soft launch setup complete! Your app is ready.")
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-2">
            The Current - Soft Launch Setup
          </h1>
          <p className="text-gray-400">
            Get your AI news platform ready for launch
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Setup Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {setupSteps.map((setupStep, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    step > index
                      ? 'border-green-500 bg-green-500/10'
                      : step === index && loading
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {step > index ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step === index && loading ? (
                      <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                    )}
                    <div>
                      <h3 className="font-semibold">{setupStep.title}</h3>
                      <p className="text-sm text-gray-400">{setupStep.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={runSetup}
            disabled={loading || step === setupSteps.length}
            className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-3 text-lg"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Setting Up...
              </>
            ) : step === setupSteps.length ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Setup Complete!
              </>
            ) : (
              'Start Setup'
            )}
          </Button>
        </div>

        {step === setupSteps.length && (
          <Card className="bg-gray-900 border-gray-700 mt-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-400 mb-3">
                  🚀 Ready for Soft Launch!
                </h3>
                <p className="text-gray-300 mb-4">
                  Your AI news platform is now ready with initial content. Here's what you can do next:
                </p>
                <div className="text-left space-y-2 text-sm text-gray-400">
                  <p>• Visit <code className="bg-gray-800 px-2 py-1 rounded">/admin</code> to manage content</p>
                  <p>• Articles will be refreshed manually through admin panel</p>
                  <p>• Users can now sign up and start reading</p>
                  <p>• Monitor engagement through the admin dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
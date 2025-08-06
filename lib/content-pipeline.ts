// lib/content-pipeline.ts
// AI News Content Pipeline - Core System for The Current

import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import Parser from 'rss-parser'

// Types based on your Supabase schema
interface Article {
  title: string
  content: string
  excerpt: string
  author: string
  source_url: string
  industry_category: string
  subcategory?: string
  tags: string[]
  published_at: string
  source_country?: string
  global_perspective_score?: number
  verification_score?: number
  image_url?: string
}

interface ProcessedContent {
  category: string
  subcategory: string
  tags: string[]
  rewrittenTitle: string
  rewrittenContent: string
  rewrittenExcerpt: string
  globalPerspectiveScore: number
  womenFocused: boolean
  trustworthySource: boolean
  aiRelevance: number
}

export class AINewsContentPipeline {
  private openai
  private claude
  private parser
  
  // Curated RSS feeds focusing on women in tech and AI - GLOBAL COVERAGE
  private rssSources = [
    // Global & Diverse Perspectives
    {
      url: 'https://globalvoices.org/category/technology/feed/',
      name: 'Global Voices Tech',
      reliability: 9,
      country: 'Global'
    },
    {
      url: 'https://www.bbc.com/news/technology/rss.xml',
      name: 'BBC Technology',
      reliability: 9,
      country: 'UK'
    },
    
    // Asia-Pacific Region
    {
      url: 'https://www.channelnewsasia.com/rss/8395894',
      name: 'Channel NewsAsia Tech',
      reliability: 8,
      country: 'Singapore'
    },
    {
      url: 'https://techinasia.com/feed',
      name: 'Tech in Asia',
      reliability: 8,
      country: 'Asia'
    },
    {
      url: 'https://www.itnews.asia/RSS/rss.ashx',
      name: 'IT News Asia',
      reliability: 7,
      country: 'Asia'
    },
    
    // Australia & New Zealand
    {
      url: 'https://www.computerworld.com.au/feed/',
      name: 'Computerworld Australia',
      reliability: 8,
      country: 'Australia'
    },
    {
      url: 'https://techday.co.nz/feed',
      name: 'Techday NZ',
      reliability: 7,
      country: 'New Zealand'
    },
    
    // Africa
    {
      url: 'https://allafrica.com/tools/headlines/rdf/africa/headlines.rdf',
      name: 'AllAfrica Tech News',
      reliability: 8,
      country: 'Africa'
    },
    {
      url: 'https://disrupt-africa.com/feed/',
      name: 'Disrupt Africa',
      reliability: 8,
      country: 'Africa'
    },
    
    // Canada
    {
      url: 'https://www.itworldcanada.com/feed',
      name: 'IT World Canada',
      reliability: 8,
      country: 'Canada'
    },
    
    // Hong Kong & Greater China
    {
      url: 'https://www.scmp.com/rss/4/feed',
      name: 'South China Morning Post Tech',
      reliability: 8,
      country: 'Hong Kong'
    },
    
    // Thailand & Southeast Asia
    {
      url: 'https://www.bangkokpost.com/rss/data/tech.xml',
      name: 'Bangkok Post Tech',
      reliability: 7,
      country: 'Thailand'
    },
    
    // Still include key US sources for global perspective
    {
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      name: 'TechCrunch AI',
      reliability: 9,
      country: 'US'
    },
    {
      url: 'https://www.technologyreview.com/feed/',
      name: 'MIT Technology Review',
      reliability: 10,
      country: 'US'
    },
    
    // Women-focused sources
    {
      url: 'https://www.forbes.com/women/feed/',
      name: 'Forbes Women',
      reliability: 8,
      country: 'US'
    }
  ]

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
    
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'enclosure']
      }
    })
  }

  // Main processing function - run this every hour
  async processAllFeeds(): Promise<void> {
    console.log('🚀 Starting AI news content pipeline...')
    
    for (const source of this.rssSources) {
      try {
        await this.processFeed(source)
        // Rate limiting between feeds
        await this.sleep(2000)
      } catch (error) {
        console.error(`❌ Error processing ${source.name}:`, error)
      }
    }
    
    console.log('✅ Content pipeline completed')
  }

  private async processFeed(source: any): Promise<void> {
    console.log(`📡 Processing feed: ${source.name}`)
    
    const feed = await this.parser.parseURL(source.url)
    
    // Process latest 3 articles from each feed
    const latestArticles = feed.items.slice(0, 3)
    
    for (const item of latestArticles) {
      try {
        // Check if article already exists
        const existing = await this.checkIfArticleExists(item.link || '')
        if (existing) {
          console.log(`⏭️  Article already exists: ${item.title}`)
          continue
        }

        // Process content with AI
        const processedContent = await this.analyzeContent(item, source)
        
        // Only save articles that meet quality criteria
        if (this.meetsCriteria(processedContent)) {
          await this.saveArticle(item, source, processedContent)
          console.log(`✅ Saved: ${item.title}`)
        } else {
          console.log(`❌ Filtered out: ${item.title}`)
        }
        
        // Rate limiting
        await this.sleep(1000)
      } catch (error) {
        console.error(`Error processing article ${item.title}:`, error)
      }
    }
  }

  private async analyzeContent(item: any, source: any): Promise<ProcessedContent> {
    const originalContent = this.extractContent(item)
    
    const prompt = `
    You are writing for "The Current" by She Is AI - a global movement empowering women and underrepresented voices in AI.

    BRAND VOICE & MISSION:
    - We exist to elevate, educate, and connect women in AI
    - We're reshaping the future with inclusive, ethical, human-first technology  
    - We celebrate founders, artists, researchers, strategists, and future-forward thinkers
    - We spotlight women leading across industries and continents
    - We make AI accessible and inspiring for everyone

    ORIGINAL ARTICLE TO REWRITE:
    Title: "${item.title}"
    Content: "${originalContent.substring(0, 1500)}..."
    Source: ${source.name}

    WRITING STYLE - STRICT REQUIREMENTS:
    - NO em dashes (—) EVER - use commas, periods, colons instead
    - Minimal hyphens (only for compound words like "AI-powered")
    - Inspiring yet accessible tone - make complex tech understandable
    - Highlight women's achievements naturally (not tokenistic)
    - Global perspective that connects diverse voices
    - Forward-looking and empowering language
    - Professional but warm and inclusive

    TONE EXAMPLES:
    ✅ "Sarah Chen's breakthrough in medical AI opens new possibilities for healthcare innovation..."
    ✅ "This development represents another step toward more inclusive technology..."
    ✅ "The global impact of this research extends from Silicon Valley to healthcare systems worldwide..."
    
    ❌ Avoid: "game-changing," "revolutionary," overhype
    ❌ Never use em dashes or excessive punctuation

    Please provide JSON response:
    {
      "rewrittenTitle": "Inspiring, clear title that captures the story's impact",
      "rewrittenContent": "Complete 3-4 paragraph rewrite (300-500 words) in She Is AI's empowering voice. Focus on innovation, global impact, and human potential. When women are mentioned, celebrate their contributions naturally.",
      "rewrittenExcerpt": "Compelling 2-sentence summary that inspires readers and highlights impact",
      "category": "one of: Technology, Healthcare, Finance, Education, Manufacturing, Retail, Government, Research",
      "subcategory": "specific area within the category", 
      "tags": ["array", "of", "relevant", "tags"],
      "globalPerspectiveScore": 1-10 (higher for diverse/international perspectives),
      "womenFocused": true/false (does this highlight women's contributions?),
      "trustworthySource": true/false (reliable source?),
      "aiRelevance": 1-10 (relevance to AI/tech innovation?)
    }

    Create original content that embodies She Is AI's mission to spotlight women reshaping the AI landscape.
    `

    try {
      // Use Claude for content rewriting (better at following style guidelines)
      const response = await this.claude.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }]
      })

      const claudeResponse = response.content[0].text
      return JSON.parse(claudeResponse || '{}')
    } catch (error) {
      console.error('Error with Claude, falling back to OpenAI:', error)
      
      // Fallback to OpenAI with same instructions
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1000
        })

        const aiResponse = response.choices[0].message.content
        return JSON.parse(aiResponse || '{}')
      } catch (fallbackError) {
        console.error('Both Claude and OpenAI failed:', fallbackError)
        // Final fallback response
        return {
          rewrittenTitle: item.title || 'Tech News Update',
          rewrittenContent: 'Technology continues to evolve rapidly across industries. This development represents another step forward in innovation and digital transformation.',
          rewrittenExcerpt: 'New developments in technology show continued innovation. This update highlights important progress in the field.',
          category: 'Technology',
          subcategory: 'AI',
          tags: ['ai', 'technology'],
          globalPerspectiveScore: 5,
          womenFocused: false,
          trustworthySource: true,
          aiRelevance: 6
        }
      }
    }
  }

  private extractContent(item: any): string {
    return item.content || item.contentSnippet || item.summary || item.description || ''
  }

  private meetsCriteria(processed: ProcessedContent): boolean {
    return (
      processed.trustworthySource &&
      processed.aiRelevance >= 6 && // Must be AI/tech relevant
      processed.rewrittenContent.length > 100 && // Must have substantial rewritten content
      !processed.rewrittenContent.includes('—') && // No em dashes allowed
      processed.rewrittenExcerpt.length > 10
    )
  }

  private async checkIfArticleExists(url: string): Promise<boolean> {
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', url)
      .single()
    
    return !!data
  }

  private async saveArticle(item: any, source: any, processed: ProcessedContent): Promise<void> {
    const article: Partial<Article> = {
      title: processed.rewrittenTitle || item.title || '',
      content: processed.rewrittenContent,
      excerpt: processed.rewrittenExcerpt,
      author: `She Is AI Editorial Team`, // Brand attribution
      source_url: item.link || '',
      industry_category: processed.category,
      subcategory: processed.subcategory,
      tags: processed.tags,
      published_at: item.pubDate || new Date().toISOString(),
      source_country: source.country,
      global_perspective_score: processed.globalPerspectiveScore,
      verification_score: source.reliability,
      image_url: this.extractImageUrl(item)
    }

    // Add women-focused and movement tags
    if (processed.womenFocused) {
      article.tags = [...(article.tags || []), 'women-in-ai', 'female-leaders', 'she-is-ai-featured']
    }

    // Add global movement tag
    article.tags = [...(article.tags || []), 'inclusive-ai', 'future-forward']

    const { error } = await supabase
      .from('articles')
      .insert([article])

    if (error) {
      throw error
    }
  }

  private extractImageUrl(item: any): string | undefined {
    if (item.enclosure?.url && item.enclosure.type?.includes('image')) {
      return item.enclosure.url
    }
    
    if (item['media:content']?.url) {
      return item['media:content'].url
    }
    
    const content = this.extractContent(item)
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    return imgMatch ? imgMatch[1] : undefined
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Usage for soft launch
export class SoftLaunchContentManager {
  private pipeline: AINewsContentPipeline

  constructor() {
    this.pipeline = new AINewsContentPipeline()
  }

  // Run this once to populate initial content
  async seedInitialContent(): Promise<void> {
    console.log('🌱 Seeding initial content for soft launch...')
    await this.pipeline.processAllFeeds()
  }

  // Manual content refresh for admin
  async refreshContent(): Promise<void> {
    await this.pipeline.processAllFeeds()
  }
}
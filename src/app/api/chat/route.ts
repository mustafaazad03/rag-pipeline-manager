import { NextRequest, NextResponse } from 'next/server'
import { getGeminiService, SearchResult } from '@/lib/services/gemini/file-search.service'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


const chatRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(10000, 'Query too long'),
  storeIds: z.array(z.string()).min(1, 'At least one store is required'),
  metadataFilter: z.string().optional(),
})


interface ChatResponse {
  success: boolean
  result?: {
    text: string
    citations: Array<{ source: string; content: string }>
    responseTimeMs: number
  }
  error?: string
}


export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = await request.json()
    
    // Validate request
    const parseResult = chatRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { query, storeIds, metadataFilter } = parseResult.data

    // Ensure store IDs have correct format
    const formattedStoreIds = storeIds.map((id) =>
      id.startsWith('fileSearchStores/') ? id : `fileSearchStores/${id}`
    )

    // Perform search
    const geminiService = getGeminiService()
    const result: SearchResult = await geminiService.search(
      query,
      formattedStoreIds,
      metadataFilter
    )

    return NextResponse.json({
      success: true,
      result: {
        text: result.text,
        citations: result.citations,
        responseTimeMs: result.responseTimeMs,
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    
    const message = error instanceof Error ? error.message : 'Search failed'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

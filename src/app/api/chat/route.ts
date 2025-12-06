import { NextRequest, NextResponse } from 'next/server'
import { getGeminiService, SearchResult } from '@/lib/services/gemini/file-search.service'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import { normalizeStoreName } from '@/lib/server/documents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


const chatRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(10000, 'Query too long'),
  storeIds: z.array(z.string()).min(1, 'At least one store is required'),
  metadataFilter: z.string().optional(),
  sessionId: z.string().optional(),
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
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    
    // Validate request
    const parseResult = chatRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { query, storeIds, metadataFilter, sessionId } = parseResult.data

    // Ensure store IDs have correct format
    const formattedStoreIds = storeIds.map((id) => normalizeStoreName(id))

    const stores = await prisma.store.findMany({
      where: {
        name: { in: formattedStoreIds },
        ownerId: profile.id,
      },
      select: { id: true, name: true },
    })

    if (stores.length !== formattedStoreIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more stores were not found' },
        { status: 404 }
      )
    }

    let sessionRecord = sessionId
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
        })
      : null

    if (!sessionRecord || sessionRecord.userId !== profile.id) {
      sessionRecord = await prisma.chatSession.create({
        data: {
          userId: profile.id,
          storeId: stores[0]?.id,
          storeIds: formattedStoreIds,
          metadataFilter: metadataFilter ?? null,
        },
      })
    }

    // Perform search
    const geminiService = getGeminiService()
    const result: SearchResult = await geminiService.search(
      query,
      formattedStoreIds,
      metadataFilter
    )

    await prisma.chatMessage.create({
      data: {
        sessionId: sessionRecord.id,
        role: 'USER',
        content: query,
      },
    })

    await prisma.chatMessage.create({
      data: {
        sessionId: sessionRecord.id,
        role: 'ASSISTANT',
        content: result.text,
        citations: result.citations,
        responseTimeMs: result.responseTimeMs,
      },
    })

    await prisma.chatSession.update({
      where: { id: sessionRecord.id },
      data: {
        storeIds: formattedStoreIds,
        metadataFilter: metadataFilter ?? null,
        responseTimeMs: result.responseTimeMs,
        storeId: stores[0]?.id,
      },
    })

    return NextResponse.json({
      success: true,
      result: {
        text: result.text,
        citations: result.citations,
        responseTimeMs: result.responseTimeMs,
      },
      sessionId: sessionRecord.id,
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

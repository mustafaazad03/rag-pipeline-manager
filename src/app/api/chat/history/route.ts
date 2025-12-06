import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import type { Citation } from '@/lib/types/api.types'

interface ChatHistoryResponse {
  success: boolean
  sessionId?: string
  messages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: Citation[]
    responseTimeMs?: number
    createdAt: string
  }>
  error?: string
}

interface BasicResponse {
  success: boolean
  error?: string
}

export async function GET(): Promise<NextResponse<ChatHistoryResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const session = await prisma.chatSession.findFirst({
      where: { userId: profile.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ success: true, messages: [] })
    }

    const messages = session.messages.map((message: (typeof session.messages)[number]) => {
      const citationValue = Array.isArray(message.citations)
        ? (message.citations as unknown as Citation[])
        : undefined

      const role: 'user' | 'assistant' = message.role === 'USER' ? 'user' : 'assistant'

      return {
        id: message.id,
        role,
        content: message.content,
        citations: citationValue,
        responseTimeMs: message.responseTimeMs ?? undefined,
        createdAt: message.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      messages,
    })
  } catch (error) {
    console.error('Error loading chat history:', error)
    const message = error instanceof Error ? error.message : 'Failed to load history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(): Promise<NextResponse<BasicResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.chatSession.deleteMany({ where: { userId: profile.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat history:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

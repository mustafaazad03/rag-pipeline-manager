import { NextRequest, NextResponse } from 'next/server'
import { getGeminiService } from '@/lib/services/gemini/file-search.service'
import { fetchStoresWithCounts } from '@/lib/server/stores'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import type { Store } from '@/lib/types/api.types'

export const runtime = 'nodejs'
export const revalidate = 60


interface ListStoresResponse {
  success: boolean
  stores?: Store[]
  error?: string
}

interface CreateStoreResponse {
  success: boolean
  store?: Store
  error?: string
}

interface DeleteStoreResponse {
  success: boolean
  error?: string
}

function buildStoreResponse(store: {
  name: string
  displayName: string | null
  createdAt: Date
  updatedAt: Date
}): Store {
  return {
    name: store.name,
    displayName: store.displayName ?? undefined,
    createTime: store.createdAt.toISOString(),
    updateTime: store.updatedAt.toISOString(),
    documentCount: 0,
    activeDocumentsCount: 0,
    failedDocumentsCount: 0,
    processingDocumentsCount: 0,
  }
}


export async function GET(): Promise<NextResponse<ListStoresResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const storesWithCounts = await fetchStoresWithCounts(profile.id)

    const response = NextResponse.json({
      success: true,
      stores: storesWithCounts,
    })
    
    // Add cache headers for faster subsequent loads (10 second cache)
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    
    return response
  } catch (error) {
    console.error('Error listing stores:', error)
    const message = error instanceof Error ? error.message : 'Failed to list stores'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}


export async function POST(request: NextRequest): Promise<NextResponse<CreateStoreResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { displayName } = body as { displayName?: string }

    const geminiService = getGeminiService()
    const store = await geminiService.createStore(displayName)

    const created = await prisma.store.create({
      data: {
        name: store.name,
        displayName: store.displayName ?? displayName ?? store.name,
        ownerId: profile.id,
      },
    })

    const response = NextResponse.json({
      success: true,
      store: buildStoreResponse(created),
    })

    return response
  } catch (error) {
    console.error('Error creating store:', error)
    const message = error instanceof Error ? error.message : 'Failed to create store'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}


export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteStoreResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      )
    }

    const storeRecord = await prisma.store.findUnique({ where: { name } })

    if (!storeRecord || storeRecord.ownerId !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      )
    }

    const geminiService = getGeminiService()
    await geminiService.deleteStore(name, true) // force delete

    await prisma.document.deleteMany({ where: { storeId: storeRecord.id } })
    await prisma.store.delete({ where: { id: storeRecord.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting store:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete store'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

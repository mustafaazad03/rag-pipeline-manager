import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getGeminiService, FileSearchStore } from '@/lib/services/gemini/file-search.service'
import { fetchStoresWithCounts } from '@/lib/server/stores'
import { STORES_CACHE_TAG } from '@/lib/server/cache-tags'

export const runtime = 'nodejs'
export const revalidate = 60


interface StoreWithDocCount extends FileSearchStore {
  documentCount?: number
}

interface ListStoresResponse {
  success: boolean
  stores?: StoreWithDocCount[]
  error?: string
}

interface CreateStoreResponse {
  success: boolean
  store?: FileSearchStore
  error?: string
}

interface DeleteStoreResponse {
  success: boolean
  error?: string
}


export async function GET(): Promise<NextResponse<ListStoresResponse>> {
  try {
    const storesWithCounts = await fetchStoresWithCounts()

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
    const body = await request.json()
    const { displayName } = body as { displayName?: string }

    const geminiService = getGeminiService()
    const store = await geminiService.createStore(displayName)

    const response = NextResponse.json({
      success: true,
      store,
    })

  revalidateTag(STORES_CACHE_TAG, 'max')
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
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      )
    }

    const geminiService = getGeminiService()
    await geminiService.deleteStore(name, true) // force delete

    const response = NextResponse.json({ success: true })
    revalidateTag(STORES_CACHE_TAG, 'max')
    return response
  } catch (error) {
    console.error('Error deleting store:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete store'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

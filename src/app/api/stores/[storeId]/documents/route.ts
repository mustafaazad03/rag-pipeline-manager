import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getGeminiService, FileSearchDocument } from '@/lib/services/gemini/file-search.service'
import { fetchDocumentsForStore, normalizeStoreName } from '@/lib/server/documents'
import { DOCUMENTS_CACHE_TAG, STORES_CACHE_TAG } from '@/lib/server/cache-tags'

export const runtime = 'nodejs'
export const revalidate = 60

interface ListDocumentsResponse {
  success: boolean
  documents?: FileSearchDocument[]
  error?: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
): Promise<NextResponse<ListDocumentsResponse>> {
  try {
    const { storeId } = await params

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const documents = await fetchDocumentsForStore(storeId)

    const response = NextResponse.json({
      success: true,
      documents,
    })
    response.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=45')
    return response
  } catch (error) {
    console.error('Error listing documents:', error)
    const message = error instanceof Error ? error.message : 'Failed to list documents'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const { storeId } = await params
    const { searchParams } = new URL(request.url)
    const documentName = searchParams.get('name')

    if (!storeId || !documentName) {
      return NextResponse.json(
        { success: false, error: 'Store ID and document name are required' },
        { status: 400 }
      )
    }

    const storeName = normalizeStoreName(storeId)
    if (!documentName.startsWith(storeName)) {
      return NextResponse.json(
        { success: false, error: 'Document does not belong to the specified store' },
        { status: 400 }
      )
    }

    const geminiService = getGeminiService()
    await geminiService.deleteDocument(documentName, true)

    const response = NextResponse.json({ success: true })
    await Promise.all([
      revalidateTag(DOCUMENTS_CACHE_TAG, 'max'),
      revalidateTag(STORES_CACHE_TAG, 'max'),
    ])
    return response
  } catch (error) {
    console.error('Error deleting document:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

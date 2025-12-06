import { NextRequest, NextResponse } from 'next/server'
import { getGeminiService } from '@/lib/services/gemini/file-search.service'
import { fetchDocumentsForStore, normalizeStoreName } from '@/lib/server/documents'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import type { Document } from '@/lib/types/api.types'

export const runtime = 'nodejs'
export const revalidate = 60

interface ListDocumentsResponse {
  success: boolean
  documents?: Document[]
  error?: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
): Promise<NextResponse<ListDocumentsResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { storeId } = await params

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      )
    }

  const documents = await fetchDocumentsForStore(storeId, profile.id)

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
    const { profile } = await getAuthenticatedUser()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
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
    const storeRecord = await prisma.store.findUnique({
      where: { name: storeName },
      select: { id: true, ownerId: true },
    })

    if (!storeRecord || storeRecord.ownerId !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      )
    }

    const documentRecord = await prisma.document.findUnique({
      where: { name: documentName },
      select: { id: true, storeId: true },
    })

    if (!documentRecord || documentRecord.storeId !== storeRecord.id) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const geminiService = getGeminiService()
    await geminiService.deleteDocument(documentName, true)
    await prisma.document.delete({ where: { id: documentRecord.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

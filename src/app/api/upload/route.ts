import { NextRequest, NextResponse } from 'next/server'
import { getGeminiService } from '@/lib/services/gemini/file-search.service'
import { normalizeStoreName } from '@/lib/server/documents'
import { getAuthenticatedUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import type { DocumentStatus } from '@prisma/client'

export const runtime = 'nodejs'

interface UploadResponse {
  success: boolean
  documents?: Array<{
    name: string
    displayName?: string
    sizeBytes?: string
    state?: string
  }>
  failed?: Array<{ fileName: string; error: string }>
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const { profile } = await getAuthenticatedUser()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const formData = await request.formData()
    const storeId = formData.get('storeId') as string | null
    const displayName = formData.get('displayName') as string | null

    const files = formData.getAll('files').filter((value): value is File => value instanceof File)
    const fallbackFile = formData.get('file')
    if (fallbackFile instanceof File) {
      files.push(fallbackFile)
    }

    // Validation
    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'No storeId provided' },
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

    const MAX_SIZE = 100 * 1024 * 1024
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const allowedExtensions = ['.pdf', '.txt', '.md', '.json', '.docx']

    const invalidFiles = files
      .map((file) => {
        if (file.size > MAX_SIZE) {
          return `${file.name} exceeds 100MB limit`
        }

        const hasValidType =
          allowedTypes.includes(file.type) ||
          allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

        if (!hasValidType) {
          return `${file.name} has an unsupported file type`
        }

        return null
      })
      .filter((message): message is string => Boolean(message))

    if (invalidFiles.length) {
      return NextResponse.json(
        { success: false, error: invalidFiles.join('; ') },
        { status: 400 }
      )
    }

    const geminiService = getGeminiService()

    const uploadResults = await Promise.allSettled(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: file.type })
        const document = await geminiService.uploadDocument(
          storeName,
          blob,
          { displayName: displayName || file.name },
          undefined,
          { waitForActive: false }
        )

        const status = toDocumentStatus(document.state)

        await prisma.document.upsert({
          where: { name: document.name },
          update: {
            displayName: document.displayName ?? file.name,
            sizeBytes: Number(document.sizeBytes ?? blob.size),
            status,
            storeId: storeRecord.id,
            uploaderId: profile.id,
          },
          create: {
            name: document.name,
            displayName: document.displayName ?? file.name,
            sizeBytes: Number(document.sizeBytes ?? blob.size),
            status,
            storeId: storeRecord.id,
            uploaderId: profile.id,
            metadata: {
              mimeType: file.type,
            },
          },
        })

        return {
          name: document.name,
          displayName: document.displayName ?? file.name,
          sizeBytes: document.sizeBytes ?? blob.size.toString(),
          state: document.state ?? 'PROCESSING',
        }
      })
    )

    const documents: UploadResponse['documents'] = []
    const failed: UploadResponse['failed'] = []

    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        documents.push(result.value)
      } else {
        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : 'Upload failed'
        failed.push({ fileName: files[index].name, error: reason })
      }
    })

    if (!documents.length) {
      return NextResponse.json(
        { success: false, error: failed.map((item) => `${item.fileName}: ${item.error}`).join('; ') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents,
      failed: failed.length ? failed : undefined,
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

function toDocumentStatus(state?: string | null): DocumentStatus {
  const normalized = state?.toUpperCase()
  switch (normalized) {
    case 'ACTIVE':
    case 'STATE_ACTIVE':
      return 'ACTIVE'
    case 'FAILED':
    case 'STATE_FAILED':
      return 'FAILED'
    case 'PROCESSING':
    case 'STATE_PROCESSING':
      return 'PROCESSING'
    default:
      return 'PENDING'
  }
}

import type { Document } from "@/lib/types/api.types"
import type { DocumentStatus } from "@prisma/client"
import { prisma } from "@/lib/server/prisma"
import { getGeminiService, type FileSearchDocument } from "@/lib/services/gemini/file-search.service"

export function normalizeStoreName(storeId: string): string {
  return storeId.startsWith("fileSearchStores/") ? storeId : `fileSearchStores/${storeId}`
}

function mapDocument(record: {
  name: string
  displayName: string | null
  sizeBytes: number | null
  status: string
  createdAt: Date
  updatedAt: Date
}): Document {
  return {
    name: record.name,
    displayName: record.displayName ?? undefined,
    sizeBytes: record.sizeBytes?.toString(),
    state: record.status,
    createTime: record.createdAt.toISOString(),
    updateTime: record.updatedAt.toISOString(),
  }
}

function normalizeDocumentStatus(state?: string | null): DocumentStatus {
  const normalized = state?.toUpperCase()
  if (!normalized) return "PROCESSING"

  if (normalized.includes("ACTIVE")) return "ACTIVE"
  if (normalized.includes("FAILED")) return "FAILED"
  if (normalized.includes("PROCESSING")) return "PROCESSING"
  return "PROCESSING"
}

function mapRemoteDocument(doc: FileSearchDocument): Document {
  return {
    name: doc.name,
    displayName: doc.displayName ?? undefined,
    sizeBytes: doc.sizeBytes,
    state: normalizeDocumentStatus(doc.state),
    createTime: doc.createTime,
    updateTime: doc.updateTime,
  }
}

export async function fetchDocumentsForStore(
  storeName: string,
  ownerId: string
): Promise<Document[]> {
  const normalized = normalizeStoreName(storeName)
  const store = await prisma.store.findUnique({
    where: { name: normalized },
    select: { id: true, ownerId: true },
  })

  if (!store || store.ownerId !== ownerId) {
    return []
  }

  try {
    const geminiService = getGeminiService()
    const remoteDocuments = await geminiService.listDocuments(normalized)

    await Promise.all(
      remoteDocuments.map((doc) =>
        prisma.document.upsert({
          where: { name: doc.name },
          update: {
            displayName: doc.displayName ?? null,
            sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : null,
            status: normalizeDocumentStatus(doc.state),
          },
          create: {
            name: doc.name,
            displayName: doc.displayName ?? null,
            sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : null,
            status: normalizeDocumentStatus(doc.state),
            storeId: store.id,
          },
        })
      )
    )

    return remoteDocuments
      .map(mapRemoteDocument)
      .sort((a, b) => (b.createTime ?? "").localeCompare(a.createTime ?? ""))
  } catch (error) {
    console.warn("Failed to refresh documents from Gemini, falling back to cache", error)
  }

  const documents = await prisma.document.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  })

  return documents.map(mapDocument)
}

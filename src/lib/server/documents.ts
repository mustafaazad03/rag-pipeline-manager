import { unstable_cache } from "next/cache"
import { DOCUMENTS_CACHE_TAG } from "@/lib/server/cache-tags"
import { getGeminiService, type FileSearchDocument } from "@/lib/services/gemini/file-search.service"

const DOCUMENTS_REVALIDATE_SECONDS = 60

export function normalizeStoreName(storeId: string): string {
  return storeId.startsWith("fileSearchStores/") ? storeId : `fileSearchStores/${storeId}`
}

async function computeStoreDocuments(storeName: string): Promise<FileSearchDocument[]> {
  const service = getGeminiService()
  return service.listDocuments(storeName)
}

const cachedDocumentsByStore = unstable_cache(
  async (storeName: string) => computeStoreDocuments(storeName),
  ["documents-by-store"],
  {
    tags: [DOCUMENTS_CACHE_TAG],
    revalidate: DOCUMENTS_REVALIDATE_SECONDS,
  }
)

interface FetchOptions {
  forceRefresh?: boolean
}

export async function fetchDocumentsForStore(
  storeId: string,
  options?: FetchOptions
): Promise<FileSearchDocument[]> {
  const storeName = normalizeStoreName(storeId)

  if (options?.forceRefresh) {
    return computeStoreDocuments(storeName)
  }

  return cachedDocumentsByStore(storeName)
}

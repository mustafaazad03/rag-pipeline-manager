import { unstable_cache } from "next/cache"
import type { Store } from "@/lib/types/api.types"
import {
  GeminiFileSearchService,
  getGeminiService,
} from "@/lib/services/gemini/file-search.service"
import { STORES_CACHE_TAG } from "@/lib/server/cache-tags"

const DOCUMENT_COUNT_TIMEOUT_MS = 3000

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    ),
  ])
}

async function computeStoresWithCounts(
  service: GeminiFileSearchService = getGeminiService(),
  timeoutMs = DOCUMENT_COUNT_TIMEOUT_MS
): Promise<Store[]> {
  const stores = await service.listStores()

  const storesWithCounts = await Promise.all(
    stores.map(async (store) => {
      try {
        const docs = await withTimeout(service.listDocuments(store.name), timeoutMs)
        return { ...store, documentCount: docs.length }
      } catch {
        return { ...store, documentCount: 0 }
      }
    })
  )

  return storesWithCounts
}

const cachedStoresWithCounts = unstable_cache(
  () => computeStoresWithCounts(),
  ["stores-with-counts"],
  {
    tags: [STORES_CACHE_TAG],
    revalidate: 60,
  }
)

export async function fetchStoresWithCounts(options?: { forceRefresh?: boolean }) {
  if (options?.forceRefresh) {
    return computeStoresWithCounts()
  }
  return cachedStoresWithCounts()
}

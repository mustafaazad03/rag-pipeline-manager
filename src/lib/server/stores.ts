import type { Store } from "@/lib/types/api.types"
import { prisma } from "@/lib/server/prisma"

async function queryStores(ownerId: string) {
  return prisma.store.findMany({
    where: { ownerId },
    include: {
      documents: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

type StoreWithDocuments = Awaited<ReturnType<typeof queryStores>>[number]
type StoreDocument = StoreWithDocuments["documents"][number]

function formatStore(store: StoreWithDocuments): Store {
  const statusCounts = store.documents.reduce(
    (
      acc: { total: number; active: number; failed: number; processing: number },
      doc: StoreDocument
    ) => {
      acc.total += 1
      if (doc.status === "ACTIVE") acc.active += 1
      if (doc.status === "FAILED") acc.failed += 1
      if (doc.status === "PROCESSING") acc.processing += 1
      return acc
    },
    { total: 0, active: 0, failed: 0, processing: 0 }
  )

  return {
    name: store.name,
    displayName: store.displayName ?? undefined,
    createTime: store.createdAt.toISOString(),
    updateTime: store.updatedAt.toISOString(),
    documentCount: statusCounts.total,
    activeDocumentsCount: statusCounts.active,
    failedDocumentsCount: statusCounts.failed,
    processingDocumentsCount: statusCounts.processing,
  }
}

export async function fetchStoresWithCounts(ownerId: string): Promise<Store[]> {
  const stores = await queryStores(ownerId)

  return stores.map(formatStore)
}

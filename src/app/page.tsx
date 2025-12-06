import { Suspense } from "react"
import { ChatPageClient } from "@/components/chat/chat-page-client"
import type { Store } from "@/lib/types/api.types"
import { fetchStoresWithCounts } from "@/lib/server/stores"

async function loadInitialStores(): Promise<Store[]> {
  try {
    return await fetchStoresWithCounts()
  } catch (error) {
    console.error("Failed to load stores on server:", error)
    return []
  }
}

export default async function Home() {
  const initialStores = await loadInitialStores()

  return (
    <Suspense fallback={<div className="py-10 text-center text-muted-foreground">Loading chat...</div>}>
      <ChatPageClient initialStores={initialStores} />
    </Suspense>
  )
}

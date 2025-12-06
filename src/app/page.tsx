import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ChatPageClient } from "@/components/chat/chat-page-client"
import type { Store } from "@/lib/types/api.types"
import { fetchStoresWithCounts } from "@/lib/server/stores"
import { getAuthenticatedUser } from "@/lib/server/auth"

async function loadInitialStores(ownerId: string): Promise<Store[]> {
  try {
    return await fetchStoresWithCounts(ownerId)
  } catch (error) {
    console.error("Failed to load stores on server:", error)
    return []
  }
}

export default async function Home() {
  const { user } = await getAuthenticatedUser()

  if (!user) {
    redirect("/login")
  }

  const initialStores = await loadInitialStores(user.id)

  return (
    <Suspense fallback={<div className="py-10 text-center text-muted-foreground">Loading chat...</div>}>
      <ChatPageClient initialStores={initialStores} />
    </Suspense>
  )
}

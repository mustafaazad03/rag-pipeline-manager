import type { Citation } from "@/lib/types/api.types"

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
  citations?: Citation[]
  isLoading?: boolean
  responseTimeMs?: number
}

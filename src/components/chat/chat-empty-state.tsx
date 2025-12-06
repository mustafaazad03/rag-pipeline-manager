import { MessageSquare } from "lucide-react"

interface ChatEmptyStateProps {
  selectedStoreCount: number
}

export function ChatEmptyState({ selectedStoreCount }: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/30" />
      <p className="text-muted-foreground">
        No messages yet. Ask a question about your documents!
      </p>
      {selectedStoreCount === 0 && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Select at least one store above to get started.
        </p>
      )}
    </div>
  )
}

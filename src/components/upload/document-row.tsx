import { FileText, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Document } from "@/lib/types/api.types"
import { formatDocumentSize, getDocumentDisplayName } from "@/lib/utils/stores"

interface DocumentRowProps {
  document: Document
  onDelete: () => void
  isDeleting: boolean
}

export function DocumentRow({ document, onDelete, isDeleting }: DocumentRowProps) {
  const displayName = getDocumentDisplayName(document)
  const sizeLabel = formatDocumentSize(document.sizeBytes)
  const stateLabel = document.state || "ready"

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="max-w-[200px] truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {sizeLabel} · {stateLabel}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  )
}

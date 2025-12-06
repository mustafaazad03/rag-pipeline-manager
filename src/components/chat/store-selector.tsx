import { motion } from "framer-motion"
import { AlertCircle, Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatStoreCountLabel, getStoreDisplayName } from "@/lib/utils/stores"
import type { Store } from "@/lib/types/api.types"

interface StoreSelectorProps {
  stores: Store[]
  selectedStores: string[]
  onToggle: (storeId: string) => void
  isLoading: boolean
  error: Error | null
}

export function StoreSelectorSection({
  stores,
  selectedStores,
  onToggle,
  isLoading,
  error,
}: StoreSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Select stores to search
        </h2>
        <span className="text-xs text-muted-foreground">
          {formatStoreCountLabel(selectedStores.length)}
        </span>
      </div>

      {error ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              {error.message || "Failed to load stores"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <StoreSelectorGrid
          stores={stores}
          selectedStores={selectedStores}
          onToggle={onToggle}
          isLoading={isLoading}
        />
      )}
    </motion.div>
  )
}

interface StoreSelectorGridProps {
  stores: Store[]
  selectedStores: string[]
  onToggle: (storeId: string) => void
  isLoading: boolean
}

function StoreSelectorGrid({ stores, selectedStores, onToggle, isLoading }: StoreSelectorGridProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-32 flex-shrink-0 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 p-4">
          <Database className="h-8 w-8 text-muted-foreground/50" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              No stores available. Create a store and upload documents first.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {stores.map((store) => {
        const isSelected = selectedStores.includes(store.name)

        return (
          <Button
            key={store.name}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-shrink-0 gap-2",
              isSelected && "bg-primary text-primary-foreground"
            )}
            onClick={() => onToggle(store.name)}
          >
            <Database className="h-3 w-3" />
            {getStoreDisplayName(store)}
            <span className="text-xs opacity-70">({store.documentCount ?? 0})</span>
          </Button>
        )
      })}
    </div>
  )
}

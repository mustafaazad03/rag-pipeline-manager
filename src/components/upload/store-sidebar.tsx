"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, FolderOpen, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { GradientButton } from "@/components/ui/shimmer-button"
import type { Store } from "@/lib/types/api.types"
import { StoreCard } from "@/components/upload/store-card"

interface StoreSidebarProps {
  stores: Store[]
  isLoading: boolean
  error: Error | null
  selectedStoreId: string | null
  deletingStoreId: string | null
  onSelect: (storeId: string) => void
  onDelete: (storeId: string) => void
  onCreateClick: () => void
}

export function StoreSidebar({
  stores,
  isLoading,
  error,
  selectedStoreId,
  deletingStoreId,
  onSelect,
  onDelete,
  onCreateClick,
}: StoreSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">File Stores</h2>
        <GradientButton className="h-9" onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Store
        </GradientButton>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {stores.map((store, index) => (
          <motion.div
            key={store.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.05 * index }}
          >
            <StoreCard
              store={store}
              isSelected={selectedStoreId === store.name}
              onSelect={() => onSelect(store.name)}
              onDelete={() => onDelete(store.name)}
              isDeleting={deletingStoreId === store.name}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {!isLoading && stores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No stores yet. Create your first store to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

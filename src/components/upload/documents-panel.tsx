"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Database, FileText, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { cn } from "@/lib/utils"
import type { Store, Document } from "@/lib/types/api.types"
import { DocumentRow } from "@/components/upload/document-row"
import { getStoreDisplayName } from "@/lib/utils/stores"

interface DocumentsPanelProps {
  selectedStore?: Store
  selectedStoreId: string | null
  documents?: Document[]
  docsLoading: boolean
  deletingDocId: string | null
  onUpload: (files: File[]) => Promise<void>
  onDeleteDocument: (documentName: string) => void
  onRefresh: () => void
}

export function DocumentsPanel({
  selectedStore,
  selectedStoreId,
  documents,
  docsLoading,
  deletingDocId,
  onUpload,
  onDeleteDocument,
  onRefresh,
}: DocumentsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-2"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Upload Documents</span>
            {selectedStore && (
              <span className="text-sm font-normal text-muted-foreground">
                → {getStoreDisplayName(selectedStore)}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supported: PDF, DOCX, TXT, JSON, MD
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedStoreId ? (
            <FileUpload onUpload={onUpload} maxSize={100} maxFiles={10} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20 p-12 text-center">
              <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a store from the left to upload documents.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStoreId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Documents in Store</CardTitle>
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={docsLoading}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", docsLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border p-3 animate-pulse">
                      <div className="h-8 w-8 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded bg-muted" />
                        <div className="h-3 w-20 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {documents.map((document) => (
                      <motion.div
                        key={document.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <DocumentRow
                          document={document}
                          onDelete={() => onDeleteDocument(document.name)}
                          isDeleting={deletingDocId === document.name}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No documents yet. Upload files above to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

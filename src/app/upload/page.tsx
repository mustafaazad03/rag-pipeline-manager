"use client"

import React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { StoreSidebar } from "@/components/upload/store-sidebar"
import { DocumentsPanel } from "@/components/upload/documents-panel"
import { CreateStoreDialog } from "@/components/upload/create-store-dialog"
import {
  useStores,
  useCreateStore,
  useDeleteStore,
  useDocuments,
  useUploadDocuments,
  useDeleteDocument,
} from "@/lib/hooks"

export default function UploadPage() {
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [deletingStoreId, setDeletingStoreId] = React.useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = React.useState<string | null>(null)

  // Queries
  const {
    data: stores,
    isLoading: storesLoading,
    error: storesError,
  } = useStores()
  const {
    data: documents,
    isLoading: docsLoading,
    refetch: refetchDocs,
  } = useDocuments(selectedStoreId)

  // Mutations
  const createStore = useCreateStore()
  const deleteStore = useDeleteStore()
  const uploadDocuments = useUploadDocuments()
  const deleteDocument = useDeleteDocument()

  // Get selected store info
  const selectedStore = stores?.find((s) => s.name === selectedStoreId)

  // Handle store creation
  const handleCreateStore = async (displayName: string) => {
    try {
      const newStore = await createStore.mutateAsync(displayName)
      toast.success("Store created successfully!")
      setCreateDialogOpen(false)
      setSelectedStoreId(newStore.name)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create store")
    }
  }

  // Handle store deletion
  const handleDeleteStore = async (storeName: string) => {
    setDeletingStoreId(storeName)
    try {
      await deleteStore.mutateAsync(storeName)
      toast.success("Store deleted successfully!")
      if (selectedStoreId === storeName) {
        setSelectedStoreId(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete store")
    } finally {
      setDeletingStoreId(null)
    }
  }

  // Handle file upload
  const handleFilesUpload = async (files: File[]) => {
    if (!selectedStoreId) {
      toast.error("Please select a store first")
      return
    }

    if (!files.length) {
      toast.error("No files selected for upload")
      return
    }

    try {
      const result = await uploadDocuments.mutateAsync({
        storeId: selectedStoreId,
        files,
      })

      const successes = result.documents ?? []
      const failures = result.failed ?? []

      if (successes.length) {
        toast.success(`Queued ${successes.length} file${successes.length > 1 ? "s" : ""} for processing`)
      }

      failures.forEach((failure) => {
        toast.error(`${failure.fileName} failed: ${failure.error}`)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload files")
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentName: string) => {
    if (!selectedStoreId) return
    
    setDeletingDocId(documentName)
    try {
      await deleteDocument.mutateAsync({
        storeId: selectedStoreId,
        documentName,
      })
      toast.success("Document deleted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document")
    } finally {
      setDeletingDocId(null)
    }
  }

  const storesErrorObject =
    storesError instanceof Error
      ? storesError
      : storesError
        ? new Error("Failed to load stores")
        : null

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Document Upload</h1>
        <p className="mt-2 text-muted-foreground">
          Upload documents to your RAG stores for intelligent search and retrieval
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <StoreSidebar
          stores={stores ?? []}
          isLoading={storesLoading}
          error={storesErrorObject}
          selectedStoreId={selectedStoreId}
          deletingStoreId={deletingStoreId}
          onSelect={(storeId) => setSelectedStoreId(storeId)}
          onDelete={handleDeleteStore}
          onCreateClick={() => setCreateDialogOpen(true)}
        />

        <DocumentsPanel
          selectedStore={selectedStore}
          selectedStoreId={selectedStoreId}
          documents={documents}
          docsLoading={docsLoading}
          deletingDocId={deletingDocId}
          onUpload={handleFilesUpload}
          onDeleteDocument={handleDeleteDocument}
          onRefresh={() => refetchDocs()}
        />
      </div>

      <CreateStoreDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateStore}
        isLoading={createStore.isPending}
      />
    </div>
  )
}

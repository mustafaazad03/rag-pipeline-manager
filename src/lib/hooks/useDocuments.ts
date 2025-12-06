import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Document, ListDocumentsResponse, UploadDocumentResponse } from '@/lib/types/api.types'
import { storeKeys } from './useStores'


export const documentKeys = {
  all: ['documents'] as const,
  list: (storeId: string) => [...documentKeys.all, 'list', storeId] as const,
}


async function fetchDocuments(storeId: string): Promise<Document[]> {
  const response = await fetch(`/api/stores/${encodeURIComponent(storeId)}/documents`)
  const data: ListDocumentsResponse = await response.json()
  
  if (!data.success || !data.documents) {
    throw new Error(data.error || 'Failed to fetch documents')
  }
  
  return data.documents
}

interface UploadParams {
  storeId: string
  files: File[]
  displayName?: string
}

async function uploadDocuments({ storeId, files, displayName }: UploadParams): Promise<UploadDocumentResponse> {
  const formData = new FormData()
  formData.append('storeId', storeId)
  if (displayName) {
    formData.append('displayName', displayName)
  }
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const data: UploadDocumentResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to upload documents')
  }

  return data
}

interface DeleteDocumentParams {
  storeId: string
  documentName: string
}

async function deleteDocument({ storeId, documentName }: DeleteDocumentParams): Promise<void> {
  const response = await fetch(
    `/api/stores/${encodeURIComponent(storeId)}/documents?name=${encodeURIComponent(documentName)}`,
    { method: 'DELETE' }
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to delete document')
  }
}

export function useDocuments(storeId: string | null) {
  return useQuery({
    queryKey: documentKeys.list(storeId || ''),
    queryFn: () => fetchDocuments(storeId!),
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}

export function useUploadDocuments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadDocuments,
    onSuccess: (_data, variables) => {
      // Invalidate both documents list and stores (for document count)
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.storeId) })
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.storeId) })
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
    },
  })
}

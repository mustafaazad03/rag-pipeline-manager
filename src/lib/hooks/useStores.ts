import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Store, ListStoresResponse, CreateStoreResponse, DeleteStoreResponse } from '@/lib/types/api.types'

export const storeKeys = {
  all: ['stores'] as const,
  list: () => [...storeKeys.all, 'list'] as const,
  detail: (id: string) => [...storeKeys.all, 'detail', id] as const,
}


async function fetchStores(): Promise<Store[]> {
  const response = await fetch('/api/stores')
  const data: ListStoresResponse = await response.json()
  
  if (!data.success || !data.stores) {
    throw new Error(data.error || 'Failed to fetch stores')
  }
  
  return data.stores
}

async function createStore(displayName?: string): Promise<Store> {
  const response = await fetch('/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  })
  
  const data: CreateStoreResponse = await response.json()
  
  if (!data.success || !data.store) {
    throw new Error(data.error || 'Failed to create store')
  }
  
  return data.store
}

async function deleteStore(name: string): Promise<void> {
  const response = await fetch(`/api/stores?name=${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  
  const data: DeleteStoreResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete store')
  }
}

interface UseStoresOptions {
  initialData?: Store[]
  initialDataUpdatedAt?: number
}

export function useStores(options?: UseStoresOptions) {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: fetchStores,
    staleTime: 30 * 1000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
    },
  })
}

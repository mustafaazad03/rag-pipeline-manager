import type { Store } from "@/lib/types/api.types"

export function getInitialStoreSelection(stores: Store[]): string[] {
  if (!stores.length) {
    return []
  }

  return [stores[0].name]
}

export function canSendMessage(
  inputValue: string,
  selectedStoreCount: number,
  isChatLoading: boolean
): boolean {
  return Boolean(inputValue.trim()) && selectedStoreCount > 0 && !isChatLoading
}

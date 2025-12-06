import type { Store, Document } from "@/lib/types/api.types"

export function getStoreDisplayName(store: Store): string {
  if (store.displayName) {
    return store.displayName
  }

  const segments = store.name.split("/")
  return segments[segments.length - 1] || store.name
}

export function getDocumentDisplayName(document: Document): string {
  if (document.displayName) {
    return document.displayName
  }

  const segments = document.name.split("/")
  return segments[segments.length - 1] || document.name
}

export function formatDocumentSize(bytes?: string): string {
  if (!bytes) {
    return "?"
  }

  const numericValue = Number(bytes)
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return "?"
  }

  const megabytes = numericValue / (1024 * 1024)
  return `${megabytes.toFixed(2)} MB`
}

export function formatStoreCountLabel(count: number): string {
  if (count <= 0) {
    return "No stores selected"
  }

  return `${count} store${count > 1 ? "s" : ""} selected`
}

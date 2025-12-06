export interface Store {
  name: string
  displayName?: string
  createTime?: string
  updateTime?: string
  documentCount?: number
  activeDocumentsCount?: number
  failedDocumentsCount?: number
  processingDocumentsCount?: number
  sizeBytes?: string
}

export interface ListStoresResponse {
  success: boolean
  stores?: Store[]
  error?: string
}

export interface CreateStoreResponse {
  success: boolean
  store?: Store
  error?: string
}

export interface DeleteStoreResponse {
  success: boolean
  error?: string
}


export interface Document {
  name: string
  displayName?: string
  sizeBytes?: string
  state?: string
  createTime?: string
  updateTime?: string
}

export interface ListDocumentsResponse {
  success: boolean
  documents?: Document[]
  error?: string
}

export interface UploadDocumentResponse {
  success: boolean
  document?: Document
  documents?: Document[]
  failed?: Array<{ fileName: string; error: string }>
  error?: string
}


export interface Citation {
  source: string
  content: string
}

export interface ChatResult {
  text: string
  citations: Citation[]
  responseTimeMs: number
}

export interface ChatResponse {
  success: boolean
  result?: ChatResult
  sessionId?: string
  error?: string
}

export interface ChatRequest {
  query: string
  storeIds: string[]
  metadataFilter?: string
  sessionId?: string
}


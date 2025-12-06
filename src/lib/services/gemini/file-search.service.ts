
import { GoogleGenAI } from '@google/genai'

export interface FileSearchStore {
  name: string
  displayName?: string
  createTime?: string
  updateTime?: string
}

export interface FileSearchDocument {
  name: string
  displayName?: string
  sizeBytes?: string
  state?: string
  createTime?: string
  updateTime?: string
  error?: {
    code?: number
    message?: string
    details?: unknown[]
  }
}

export interface CustomMetadataEntry {
  key: string
  stringValue?: string
  numericValue?: number
}

export interface UploadConfig {
  displayName?: string
  customMetadata?: CustomMetadataEntry[]
  chunkingConfig?: {
    whiteSpaceConfig?: {
      maxTokensPerChunk?: number
      maxOverlapTokens?: number
    }
  }
}

export interface SearchResult {
  text: string
  groundingMetadata?: unknown
  citations: Array<{ source: string; content: string }>
  responseTimeMs: number
}

export interface UploadDocumentOptions {
  waitForActive?: boolean
}


export class GeminiFileSearchService {
  private ai: GoogleGenAI

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error('GEMINI_API_KEY is required for GeminiFileSearchService')
    }
    this.ai = new GoogleGenAI({ apiKey: key })
  }

  async createStore(displayName?: string): Promise<FileSearchStore> {
    const store = await this.ai.fileSearchStores.create({
      config: displayName ? { displayName } : undefined,
    })
    return store as FileSearchStore
  }

  async listStores(): Promise<FileSearchStore[]> {
    const stores: FileSearchStore[] = []
    const pager = await this.ai.fileSearchStores.list()
    for await (const store of pager) {
      stores.push(store as FileSearchStore)
    }
    return stores
  }

  async getStore(name: string): Promise<FileSearchStore> {
    const store = await this.ai.fileSearchStores.get({ name })
    return store as FileSearchStore
  }

  async deleteStore(name: string, force = true): Promise<void> {
    await this.ai.fileSearchStores.delete({ name, config: { force } })
  }

  async uploadDocument(
    fileSearchStoreName: string,
    file: Blob | Buffer,
    config?: UploadConfig,
    onProgress?: (progress: number) => void,
    options?: UploadDocumentOptions
  ): Promise<FileSearchDocument> {
    let blob: Blob
    if (file instanceof Blob) {
      blob = file
    } else {
      const uint8 = new Uint8Array(file.buffer, file.byteOffset, file.byteLength)
      blob = new Blob([uint8 as unknown as BlobPart])
    }

    onProgress?.(10)

    const operation = await this.ai.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName,
      file: blob,
      config: config
        ? {
            displayName: config.displayName,
            customMetadata: config.customMetadata,
            chunkingConfig: config.chunkingConfig,
          }
        : undefined,
    })

    onProgress?.(40)

    const opResponse = operation.response as { documentName?: string; parent?: string } | undefined
    let documentName = opResponse?.documentName

    if (!documentName && operation.metadata) {
      const metadata = operation.metadata as { documentName?: string }
      documentName = metadata.documentName
    }

    if (!documentName) {
      console.log('No document name in response, searching in store...')
      await this.delay(2000)
      
      const docs = await this.listDocuments(fileSearchStoreName)
      const displayNameToFind = config?.displayName || 'uploaded'
      
      const matchingDoc = docs
        .filter(d => d.displayName === displayNameToFind || d.name?.includes(displayNameToFind.replace(/\.[^/.]+$/, '')))
        .sort((a, b) => {
          const timeA = a.createTime ? new Date(a.createTime).getTime() : 0
          const timeB = b.createTime ? new Date(b.createTime).getTime() : 0
          return timeB - timeA // Most recent first
        })[0]

      if (matchingDoc) {
        documentName = matchingDoc.name
      }
    }

    if (!documentName) {
      // Return the operation response as-is if we have one
      if (opResponse) {
        onProgress?.(100)
        return {
          name: opResponse.documentName || `${fileSearchStoreName}/documents/unknown`,
          displayName: config?.displayName,
          state: 'PROCESSING',
        }
      }
      throw new Error('Upload completed but could not determine document name')
    }

    const waitForActive = options?.waitForActive !== false

    if (!waitForActive) {
      onProgress?.(100)
      return {
        name: documentName,
        displayName: config?.displayName,
        sizeBytes: blob.size?.toString(),
        state: 'PROCESSING',
      }
    }

    // Now poll the document status until it's no longer PROCESSING
    onProgress?.(60)
    
    let document: FileSearchDocument | null = null
    let pollCount = 0
    const maxPolls = 60 // Max 60 seconds for processing
    
    while (pollCount < maxPolls) {
      try {
        document = await this.getDocument(documentName)
        
        // Check if processing is complete
        if (document.state === 'ACTIVE' || document.state === 'STATE_ACTIVE') {
          onProgress?.(100)
          return document
        }
        
        if (document.state === 'FAILED' || document.state === 'STATE_FAILED') {
          // Build a detailed error message
          let errorDetails = 'Document processing failed.'
          
          if (document.error?.message) {
            errorDetails += ` Reason: ${document.error.message}`
          } else {
            errorDetails += ' The file may be corrupted, too large, or in an unsupported format.'
          }
          
          errorDetails += '\n\nSupported formats: PDF, TXT, HTML, CSS, CSV, TSV, Markdown, XML, RTF.'
          errorDetails += '\nMax file size: 50MB.'
          
          throw new Error(errorDetails)
        }
        
        pollCount++
        const processingProgress = Math.min(60 + (pollCount / maxPolls) * 35, 95)
        onProgress?.(processingProgress)
        
        await this.delay(1000)
      } catch (getError) {
        console.warn('Error getting document status:', getError)
        pollCount++
        await this.delay(1000)
      }
    }

    onProgress?.(100)
    
    if (document) {
      return document
    }

    return {
      name: documentName,
      displayName: config?.displayName,
      state: 'PROCESSING',
    }
  }

  async importFile(
    fileSearchStoreName: string,
    fileName: string,
    customMetadata?: CustomMetadataEntry[]
  ): Promise<FileSearchDocument> {
    let operation = await this.ai.fileSearchStores.importFile({
      fileSearchStoreName,
      fileName,
      config: customMetadata ? { customMetadata } : undefined,
    })

    // Poll until the operation completes (if not already done)
    let pollCount = 0
    const maxPolls = 30
    
    while (!operation.done && pollCount < maxPolls) {
      await this.delay(1000)
      try {
        operation = await this.ai.operations.get({ operation })
        pollCount++
      } catch (pollError) {
        console.warn('Polling error (may be expected if import completed):', pollError)
        if (operation.done || operation.response) {
          break
        }
        throw pollError
      }
    }

    if (operation.error) {
      throw new Error(`Import failed: ${JSON.stringify(operation.error)}`)
    }

    return operation.response as FileSearchDocument
  }

  async listDocuments(fileSearchStoreName: string): Promise<FileSearchDocument[]> {
    const docs: FileSearchDocument[] = []
    const pager = await this.ai.fileSearchStores.documents.list({
      parent: fileSearchStoreName,
    })
    for await (const doc of pager) {
      docs.push(doc as FileSearchDocument)
    }
    return docs
  }

  async getDocument(name: string): Promise<FileSearchDocument> {
    const doc = await this.ai.fileSearchStores.documents.get({ name })
    return doc as FileSearchDocument
  }

  async deleteDocument(name: string, force = true): Promise<void> {
    await this.ai.fileSearchStores.documents.delete({ name, config: { force } })
  }

  async search(
    query: string,
    fileSearchStoreNames: string[],
    metadataFilter?: string,
    model = 'gemini-2.5-flash'
  ): Promise<SearchResult> {
    const startTime = Date.now()

    const response = await this.ai.models.generateContent({
      model,
      contents: query,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames,
              metadataFilter,
            },
          },
        ],
      },
    })

    const responseTimeMs = Date.now() - startTime

    // Extract citations from grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata
    const citations: SearchResult['citations'] = []
    
    // Map to group content by source (for unique sources)
    const sourceContentMap = new Map<string, string[]>()

    if (groundingMetadata && typeof groundingMetadata === 'object') {
      const gm = groundingMetadata as Record<string, unknown>
      
      // Try to get grounding chunks
      const chunks = gm.groundingChunks as Array<{ 
        retrievedContext?: { 
          uri?: string
          title?: string
          text?: string 
        } 
      }> | undefined
      
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.retrievedContext) {
            // Extract a meaningful source name
            let source = chunk.retrievedContext.title || chunk.retrievedContext.uri || 'Document'
            
            // If source is a path, extract just the filename
            if (source.includes('/')) {
              const parts = source.split('/')
              source = parts[parts.length - 1] || source
            }
            
            // Clean up the source name
            source = source
              .replace(/^documents\//, '')
              .replace(/-[a-z0-9]{10,}$/i, '') // Remove random suffixes
              .replace(/\.[^/.]+$/, '') // Remove file extension for display
              .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
              .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
              .trim()
            
            // Capitalize first letter
            source = source.charAt(0).toUpperCase() + source.slice(1)
            
            // Get a clean excerpt from the content
            let content = chunk.retrievedContext.text || ''
            
            // Clean up the content - remove page markers and excessive whitespace
            content = content
              .replace(/---\s*PAGE\s*\d+\s*---/gi, '')
              .replace(/\n{3,}/g, '\n\n')
              .replace(/\s+/g, ' ')
              .trim()
            
            // Skip empty or very short content
            if (content.length < 20) continue
            
            // Group content by source
            if (!sourceContentMap.has(source)) {
              sourceContentMap.set(source, [])
            }
            
            // Add content if it's not a duplicate snippet
            const existingContents = sourceContentMap.get(source)!
            const isDuplicate = existingContents.some(
              existing => existing.includes(content.substring(0, 50)) || content.includes(existing.substring(0, 50))
            )
            
            if (!isDuplicate) {
              existingContents.push(content)
            }
          }
        }
      }
      
      // Convert map to citations array with merged content
      for (const [source, contents] of sourceContentMap) {
        // Join multiple content snippets, limit total length
        let mergedContent = contents.slice(0, 3).join(' [...] ')
        
        if (mergedContent.length > 400) {
          mergedContent = mergedContent.substring(0, 397) + '...'
        }
        
        citations.push({
          source,
          content: mergedContent,
        })
      }
    }

    // Limit to top 5 most relevant citations
    const topCitations = citations.slice(0, 5)

    return {
      text: response.text ?? '',
      groundingMetadata,
      citations: topCitations,
      responseTimeMs,
    }
  }

  async uploadFile(file: Blob | Buffer, displayName?: string) {
    let blob: Blob
    if (file instanceof Blob) {
      blob = file
    } else {
      const uint8 = new Uint8Array(file.buffer, file.byteOffset, file.byteLength)
      blob = new Blob([uint8 as unknown as BlobPart])
    }
    const uploaded = await this.ai.files.upload({
      file: blob,
      config: displayName ? { displayName } : undefined,
    })
    return uploaded
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

let _geminiService: GeminiFileSearchService | null = null

export function getGeminiService(): GeminiFileSearchService {
  if (!_geminiService) {
    _geminiService = new GeminiFileSearchService()
  }
  return _geminiService
}

export const geminiService = {
  get instance() {
    return getGeminiService()
  },
}

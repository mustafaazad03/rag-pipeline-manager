import { useMutation } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import type { ChatResponse, ChatResult } from '@/lib/types/api.types'
import type { ChatMessage } from '@/lib/types/chat.types'

interface ChatParams {
  query: string
  storeIds: string[]
  metadataFilter?: string
  sessionId?: string
}

interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: ChatMessage['citations']
  responseTimeMs?: number
  createdAt: string
}

interface ChatHistoryResponse {
  success: boolean
  sessionId?: string
  messages?: ChatHistoryMessage[]
  error?: string
}

async function sendChatMessage(params: ChatParams): Promise<{ result: ChatResult; sessionId?: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data: ChatResponse = await response.json()

  if (!data.success || !data.result) {
    throw new Error(data.error || 'Chat request failed')
  }

  return { result: data.result, sessionId: data.sessionId }
}

async function fetchChatHistory(): Promise<{ sessionId: string | null; messages: ChatMessage[] }> {
  const response = await fetch('/api/chat/history')
  const data: ChatHistoryResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to load chat history')
  }

  const hydratedMessages = (data.messages ?? []).map<ChatMessage>((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    citations: message.citations,
    responseTimeMs: message.responseTimeMs,
    timestamp: new Date(message.createdAt),
  }))

  return {
    sessionId: data.sessionId ?? null,
    messages: hydratedMessages,
  }
}

async function clearChatHistory(): Promise<void> {
  await fetch('/api/chat/history', { method: 'DELETE' })
}

export interface UseChatOptions {
  storeIds: string[]
  metadataFilter?: string
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: sendChatMessage,
  })

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || options.storeIds.length === 0) return

      // Generate unique ID
      const userMessageId = `user-${Date.now()}`
      const assistantMessageId = `assistant-${Date.now()}`

      // Add user message
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      // Add loading assistant message
      const loadingMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      }

      setMessages((prev) => [...prev, userMessage, loadingMessage])

      try {
        const { result, sessionId: returnedSessionId } = await mutation.mutateAsync({
          query: content.trim(),
          storeIds: options.storeIds,
          metadataFilter: options.metadataFilter,
          sessionId: sessionId ?? undefined,
        })

        if (returnedSessionId) {
          setSessionId(returnedSessionId)
        }

        // Update assistant message with result
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: result.text,
                  citations: result.citations,
                  isLoading: false,
                }
              : msg
          )
        )
      } catch (error) {
        // Update assistant message with error
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Error: ${errorMessage}`,
                  isLoading: false,
                }
              : msg
          )
        )
      }
    },
    [mutation, options.storeIds, options.metadataFilter, sessionId]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(null)
    void clearChatHistory()
  }, [])

  useEffect(() => {
    let active = true

    fetchChatHistory()
      .then(({ sessionId: initialSessionId, messages: initialMessages }) => {
        if (!active) return
        setMessages(initialMessages)
        setSessionId(initialSessionId)
      })
      .catch((error) => {
        console.warn('Failed to load chat history', error)
      })

    return () => {
      active = false
    }
  }, [])

  const normalizedError = mutation.error
    ? mutation.error instanceof Error
      ? mutation.error
      : new Error(String(mutation.error))
    : null

  return {
    messages,
    isLoading: mutation.isPending,
    error: normalizedError,
    sendMessage,
    clearMessages,
  }
}

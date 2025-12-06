import { useMutation } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { ChatResponse, ChatResult } from '@/lib/types/api.types'
import type { ChatMessage } from '@/lib/types/chat.types'

interface ChatParams {
  query: string
  storeIds: string[]
  metadataFilter?: string
}

async function sendChatMessage(params: ChatParams): Promise<ChatResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data: ChatResponse = await response.json()

  if (!data.success || !data.result) {
    throw new Error(data.error || 'Chat request failed')
  }

  return data.result
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
        const result = await mutation.mutateAsync({
          query: content.trim(),
          storeIds: options.storeIds,
          metadataFilter: options.metadataFilter,
        })

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
    [mutation, options.storeIds, options.metadataFilter]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
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

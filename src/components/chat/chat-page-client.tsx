"use client"

import { useCallback, useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { StoreSelectorSection } from "@/components/chat/store-selector"
import { ChatPanel } from "@/components/chat/chat-panel"
import { useStores, useChat } from "@/lib/hooks"
import type { Store } from "@/lib/types/api.types"
import {
  canSendMessage,
  getInitialStoreSelection,
} from "@/lib/utils/chat"

interface ChatPageClientProps {
  initialStores: Store[]
}

export function ChatPageClient({ initialStores }: ChatPageClientProps) {
  const [selectedStores, setSelectedStores] = useState<string[]>(() =>
    getInitialStoreSelection(initialStores)
  )
  const [inputValue, setInputValue] = useState("")
  const [initialStoresUpdatedAt] = useState(() => Date.now())

  const { data: stores = [], isLoading: storesLoading, error: storesError } = useStores({
    initialData: initialStores,
    initialDataUpdatedAt: initialStoresUpdatedAt,
  })

  const { messages, isLoading: chatLoading, sendMessage, clearMessages } = useChat({
    storeIds: selectedStores,
  })

  const handleToggleStore = useCallback((storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    )
  }, [])

  const handleSend = useCallback(async () => {
    if (!canSendMessage(inputValue, selectedStores.length, chatLoading)) {
      return
    }

    const query = inputValue.trim()
    setInputValue("")
    await sendMessage(query)
  }, [chatLoading, inputValue, selectedStores.length, sendMessage])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const canSend = useMemo(
    () => canSendMessage(inputValue, selectedStores.length, chatLoading),
    [chatLoading, inputValue, selectedStores.length]
  )

  const resolvedError = useMemo(() => {
    if (!storesError) {
      return null
    }
    return storesError instanceof Error ? storesError : new Error(String(storesError))
  }, [storesError])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <ChatHeader />

      <StoreSelectorSection
        stores={stores}
        selectedStores={selectedStores}
        onToggle={handleToggleStore}
        isLoading={storesLoading}
        error={resolvedError}
      />

      <ChatPanel
        messages={messages}
        isLoading={chatLoading}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onKeyDown={handleKeyPress}
        onSend={handleSend}
        onClear={clearMessages}
        canSend={canSend}
        selectedStoreCount={selectedStores.length}
      />
    </div>
  )
}

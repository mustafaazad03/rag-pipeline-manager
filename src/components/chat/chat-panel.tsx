import { useEffect, useRef } from "react"
import type { KeyboardEvent } from "react"
import { AnimatePresence } from "framer-motion"
import { Loader2, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/shimmer-button"
import type { ChatMessage } from "@/lib/types/chat.types"
import { ChatEmptyState } from "@/components/chat/chat-empty-state"
import { MessageBubble } from "@/components/chat/message-bubble"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  messages: ChatMessage[]
  isLoading: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onSend: () => void
  onClear: () => void
  canSend: boolean
  selectedStoreCount: number
}

export function ChatPanel({
  messages,
  isLoading,
  inputValue,
  onInputChange,
  onKeyDown,
  onSend,
  onClear,
  canSend,
  selectedStoreCount,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="flex min-h-[400px] flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">Chat</CardTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <ChatEmptyState selectedStoreCount={selectedStoreCount} />
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              selectedStoreCount === 0
                ? "Select a store first..."
                : "Ask a question about your documents..."
            }
            disabled={selectedStoreCount === 0 || isLoading}
            className="h-12 flex-1 rounded-3xl border-gray-300 px-4"
          />
          <GradientButton
            onClick={onSend}
            disabled={!canSend}
            className={cn("px-4", !canSend && "opacity-50")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </GradientButton>
        </div>
        {selectedStoreCount === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Select at least one store to start chatting.
          </p>
        )}
      </div>
    </Card>
  )
}

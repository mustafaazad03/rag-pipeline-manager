"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Sparkles, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Array<{ source: string; content: string }>
  timestamp: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on your documents, here's what I found about "${userMessage.content}":\n\nThis is a simulated response. Connect to the Gemini File Search API to get real RAG responses with citations from your uploaded documents.`,
        citations: [
          { source: "document1.pdf", content: "Relevant excerpt from document..." },
          { source: "document2.docx", content: "Another relevant section..." },
        ],
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about your documents..."
                className={cn(
                  "h-12 rounded-xl border-border/50 bg-muted/30 pr-12",
                  "placeholder:text-muted-foreground/50",
                  "focus-visible:ring-primary/50"
                )}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-1.5 top-1.5 h-9 w-9 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90",
                  "disabled:opacity-50"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            RAG Pipeline Manager uses Gemini File Search for grounded responses
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Start a Conversation
        </h2>
        <p className="mb-6 max-w-md text-muted-foreground">
          Upload documents to your RAG store, then ask questions to get AI-powered answers with citations.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 max-w-lg mx-auto">
          {[
            "What are the key points in document X?",
            "Summarize the main findings",
            "Compare sections A and B",
            "Find information about topic Y",
          ].map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={cn(
                "rounded-xl border border-border/50 bg-card p-3 text-left text-sm",
                "text-muted-foreground hover:text-foreground",
                "hover:border-primary/50 hover:bg-accent/50",
                "transition-colors"
              )}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        <Card
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </Card>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.citations.map((citation, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2 py-1",
                  "bg-accent/50 text-xs text-muted-foreground",
                  "hover:bg-accent cursor-pointer transition-colors"
                )}
              >
                <FileText className="h-3 w-3" />
                {citation.source}
              </motion.div>
            ))}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/50">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  )
}

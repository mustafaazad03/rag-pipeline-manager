import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { Loader2, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types/chat.types"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  const proseBase =
    "text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit"
  const userProseColors =
    "text-primary-foreground prose-p:text-primary-foreground prose-li:text-primary-foreground prose-strong:text-primary-foreground prose-headings:text-primary-foreground prose-code:text-primary-foreground prose-a:text-primary-foreground"
  const assistantProseColors = "text-foreground dark:prose-invert"

  const contentProseClass = cn(proseBase, isUser ? userProseColors : assistantProseColors)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-muted/50 text-foreground"
        )}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <>
            <div className={contentProseClass}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-medium">
                  <Quote className="h-3 w-3" />
                  Sources
                </p>
                <div className="space-y-1">
                  {message.citations.map((citation, index) => (
                    <div
                      key={`${message.id}-citation-${index}`}
                      className="truncate rounded bg-background/50 px-2 py-1 text-xs"
                    >
                      {citation.source}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

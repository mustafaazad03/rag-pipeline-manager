import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function ChatHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      <div className="mb-4 inline-flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">RAG Search</h1>
      </div>
      <p className="mx-auto max-w-md text-muted-foreground">
        Ask questions about your uploaded documents. AI will search and provide answers
        with citations.
      </p>
    </motion.div>
  )
}

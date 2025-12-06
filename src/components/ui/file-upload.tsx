"use client"

import React, { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, File, X, CheckCircle2, Loader2, FileText, FileImage, FileArchive, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
}

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
  className?: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return FileImage
  if (type.includes("pdf") || type.includes("document")) return FileText
  if (type.includes("zip") || type.includes("archive")) return FileArchive
  return File
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function FileUpload({
  onFilesSelected,
  onUpload,
  accept = ".pdf,.docx,.txt,.json,.md",
  maxSize = 100,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles)
      const validFiles: File[] = []

      fileArray.forEach((file) => {
        if (file.size > maxSize * 1024 * 1024) {
          console.warn(`File ${file.name} exceeds ${maxSize}MB limit`)
          return
        }
        validFiles.push(file)
      })

      if (validFiles.length > 0) {
        // Files are now in "pending" status - no fake progress
        const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          progress: 0,
          status: "pending" as const,
        }))

        setUploadedFiles((prev) => [...prev, ...newUploadedFiles])
        setUploadComplete(false)
        onFilesSelected?.(validFiles)
      }
    },
    [maxFiles, maxSize, onFilesSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const { files } = e.dataTransfer
      if (files?.length) {
        processFiles(files)
      }
    },
    [processFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files?.length) {
        processFiles(files)
      }
      e.target.value = ""
    },
    [processFiles]
  )

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    setUploadComplete(false)
  }

  const handleUploadAll = async () => {
    if (!onUpload) return
    
    const pendingFiles = uploadedFiles.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    
    const pendingIds = new Set(pendingFiles.map((file) => file.id))

    // Mark all pending files as uploading
    setUploadedFiles((prev) =>
      prev.map((f) =>
        pendingIds.has(f.id) ? { ...f, status: "uploading" as const, progress: 25 } : f
      )
    )

    try {
      const files = pendingFiles.map((f) => f.file)
      await onUpload(files)

      setUploadedFiles((prev) =>
        prev.map((f) =>
          pendingIds.has(f.id)
            ? { ...f, status: "complete" as const, progress: 100, error: undefined }
            : f
        )
      )

      setUploadComplete(true)

      setTimeout(() => {
        setUploadedFiles((prev) => prev.filter((f) => f.status !== "complete"))
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setUploadedFiles((prev) =>
        prev.map((f) =>
          pendingIds.has(f.id)
            ? { ...f, status: "error" as const, error: message }
            : f
        )
      )
    } finally {
      setIsUploading(false)
    }
  }

  const pendingCount = uploadedFiles.filter((f) => f.status === "pending").length
  const hasErrors = uploadedFiles.some((f) => f.status === "error")

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          borderColor: isDragOver ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-8 transition-colors",
          "bg-gradient-to-b from-background to-muted/20",
          "dark:from-background dark:to-muted/10",
          isDragOver && "border-primary bg-primary/5 dark:bg-primary/10"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <motion.div
            animate={{ y: isDragOver ? -5 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "rounded-full p-4",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              "dark:from-primary/30 dark:to-primary/10"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )}
            />
          </motion.div>

          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {isDragOver ? "Drop files here" : "Drag & drop files"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse • Max {maxSize}MB per file
            </p>
            <p className="text-xs text-muted-foreground/70">
              Supports PDF, DOCX, TXT, JSON, MD
            </p>
          </div>
        </div>

        {/* Animated border effect */}
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        )}
      </motion.div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Success message */}
            {uploadComplete && !hasErrors && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-600 dark:text-green-400"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">All files uploaded successfully!</span>
              </motion.div>
            )}

            {uploadedFiles.map((uploadedFile) => {
              const FileIcon = getFileIcon(uploadedFile.file.type)
              return (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    "bg-card dark:bg-card/50",
                    "transition-colors hover:bg-accent/50",
                    uploadedFile.status === "error" && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      uploadedFile.status === "error" 
                        ? "bg-destructive/10"
                        : "bg-primary/10 dark:bg-primary/20"
                    )}
                  >
                    <FileIcon className={cn(
                      "h-5 w-5",
                      uploadedFile.status === "error" ? "text-destructive" : "text-primary"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                      {uploadedFile.status === "error" && uploadedFile.error && (
                        <span className="text-destructive ml-2">• {uploadedFile.error}</span>
                      )}
                    </p>
                    {uploadedFile.status === "uploading" && (
                      <Progress
                        value={uploadedFile.progress}
                        className="mt-2 h-1"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedFile.status === "pending" && (
                      <span className="text-xs text-muted-foreground">Ready</span>
                    )}
                    {uploadedFile.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {uploadedFile.status === "complete" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={uploadedFile.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 pt-2"
            >
              {pendingCount > 0 && onUpload && (
                <Button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="flex-1 gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {pendingCount} file{pendingCount > 1 ? "s" : ""} to RAG Store
                    </>
                  )}
                </Button>
              )}
              {uploadedFiles.length > 0 && !isUploading && (
                <Button
                  variant="outline"
                  onClick={clearAllFiles}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

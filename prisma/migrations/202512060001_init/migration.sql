-- Initial Prisma migration

CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACTIVE', 'FAILED');
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE,
  "displayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Store" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "displayName" TEXT,
  "description" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Store_name_key" UNIQUE ("name"),
  CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");

CREATE TABLE "Document" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "displayName" TEXT,
  "sizeBytes" INTEGER,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "storeId" TEXT NOT NULL,
  "uploaderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_name_key" UNIQUE ("name"),
  CONSTRAINT "Document_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Document_storeId_idx" ON "Document"("storeId");
CREATE INDEX "Document_uploaderId_idx" ON "Document"("uploaderId");

CREATE TABLE "ChatSession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "storeId" TEXT,
  "storeIds" TEXT[] NOT NULL,
  "metadataFilter" TEXT,
  "title" TEXT,
  "responseTimeMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");
CREATE INDEX "ChatSession_storeId_idx" ON "ChatSession"("storeId");

CREATE TABLE "ChatMessage" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "role" "ChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "citations" JSONB,
  "responseTimeMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

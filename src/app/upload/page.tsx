import { redirect } from "next/navigation"
import { UploadPageClient } from "./upload-page-client"
import { getAuthenticatedUser } from "@/lib/server/auth"

export default async function UploadPage() {
  const { user } = await getAuthenticatedUser()

  if (!user) {
    redirect("/login?redirect=/upload")
  }

  return <UploadPageClient />
}

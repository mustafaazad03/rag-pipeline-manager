import { redirect } from "next/navigation"
import { SettingsPageClient } from "./settings-page-client"
import { getAuthenticatedUser } from "@/lib/server/auth"

export default async function SettingsPage() {
  const { user, profile } = await getAuthenticatedUser()

  if (!user || !profile) {
    redirect("/login?redirect=/settings")
  }

  return <SettingsPageClient initialProfile={profile} initialUser={user} />
}


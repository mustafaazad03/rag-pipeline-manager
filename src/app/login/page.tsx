import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { createServerSupabaseClient } from "@/lib/utils/supabase/server"

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">RAG Pipeline Manager</p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Log in to continue</h1>
          <p className="mt-2 text-muted-foreground">
            Access your stores, documents, and conversations.
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import { loginAction, signupAction } from "@/lib/server/auth-actions"
import { authInitialState } from "@/lib/auth/auth-action-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AuthFormProps {
  mode: "login" | "signup"
}

const titles = {
  login: {
    title: "Welcome back",
    description: "Sign in to keep exploring your RAG pipelines.",
    cta: "Sign in",
    footer: {
      label: "Need an account?",
      href: "/signup",
      linkLabel: "Sign up",
    },
  },
  signup: {
    title: "Create your account",
    description: "Start managing documents with Gemini File Search.",
    cta: "Create account",
    footer: {
      label: "Already have an account?",
      href: "/login",
      linkLabel: "Sign in",
    },
  },
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait..." : children}
    </Button>
  )
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect")
  const redirectPath = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/"
  const [state, formAction] = useActionState(
    mode === "login" ? loginAction : signupAction,
    authInitialState
  )

  useEffect(() => {
    if (state.success) {
      router.replace(redirectPath)
      router.refresh()
    }
  }, [router, state.success, redirectPath])

  const copy = titles[mode]

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4 flex flex-col text-left">
          {mode === "signup" && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <Input id="name" name="name" placeholder="Ada Lovelace" autoComplete="name" />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton>{copy.cta}</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.footer.label}{" "}
          <Link className="font-medium text-primary hover:underline" href={copy.footer.href}>
            {copy.footer.linkLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

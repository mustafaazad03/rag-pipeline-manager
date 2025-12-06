"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, MessageSquare, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createBrowserSupabaseClient } from "@/lib/utils/supabase/client"

const navItems = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUserEmail(data.user?.email ?? null)
    })

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      router.refresh()
    })

    return () => {
      mounted = false
      subscription?.subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    setUserEmail(null)
    router.replace("/login")
    router.refresh()
  }

  const activeTab = React.useMemo(() => {
    if (!pathname) return "/"

    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "")

    const matchedItem = navItems.find((item) => {
      if (item.href === "/") {
        return normalizedPath === "/"
      }

      return normalizedPath.startsWith(item.href)
    })

    return matchedItem?.href ?? "/"
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              RAG Pipeline
            </h1>
            <p className="text-xs text-muted-foreground">Document Intelligence</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 p-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative gap-2 rounded-full transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {userEmail ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

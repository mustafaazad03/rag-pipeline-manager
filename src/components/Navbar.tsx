"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, MessageSquare, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()

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
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

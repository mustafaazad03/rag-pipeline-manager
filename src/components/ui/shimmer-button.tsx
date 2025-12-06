"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ShimmerButtonProps {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  borderRadius = "100px",
  // shimmerDuration = "3s",
  background = "rgba(0, 0, 0, 1)",
  className,
  children,
  onClick,
  disabled,
  type = "button",
}: ShimmerButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white",
        "[background:var(--bg)] [border-radius:var(--radius)]",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={
        {
          "--bg": background,
          "--radius": borderRadius,
          "--shimmer-color": shimmerColor,
        } as React.CSSProperties
      }
    >
      {/* Shimmer effect */}
      <div
        className={cn(
          "absolute inset-0 z-[-1] overflow-hidden",
          "[border-radius:var(--radius)]"
        )}
      >
        <div
          className="absolute inset-[-100%] animate-shimmer"
          style={{
            background: `conic-gradient(from 0deg, transparent 0 340deg, ${shimmerColor} 360deg)`,
          }}
        />
      </div>

      {/* Inner background */}
      <div
        className={cn(
          "absolute z-[-1]",
          "[border-radius:var(--radius)]",
          "[inset:var(--shimmer-size)]",
          "[background:var(--bg)]"
        )}
        style={
          {
            "--shimmer-size": shimmerSize,
          } as React.CSSProperties
        }
      />

      {children}
    </motion.button>
  )
}

interface GradientButtonProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

// Gradient Shimmer Button variant
export function GradientButton({
  className,
  children,
  onClick,
  disabled,
  type = "button",
}: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background border border-gray-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {/* <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" /> */}
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-6 py-2 text-sm font-medium text-foreground backdrop-blur-3xl transition-colors hover:bg-accent dark:border-none dark:bg-transparent">
        {children}
      </span>
    </motion.button>
  )
}

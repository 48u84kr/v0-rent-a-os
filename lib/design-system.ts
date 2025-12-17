// Design System - Reusable animation and styling utilities for a unified tech company aesthetic
// Import: import { ds, cn } from '@/lib/design-system'

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function to merge class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// BUTTON STYLES
// ============================================

export const buttonStyles = {
  primary: cn(
    "rounded-xl bg-primary text-primary-foreground",
    "hover:bg-primary/90",
    "relative overflow-hidden group",
    "transition-all duration-300",
    "hover:shadow-xl hover:shadow-primary/30",
    "hover:scale-105 active:scale-95",
  ),

  primaryIndigo: cn(
    "rounded-xl bg-chart-1 text-primary-foreground",
    "hover:bg-chart-1/90",
    "relative overflow-hidden group",
    "transition-all duration-300",
    "hover:scale-105 hover:shadow-lg hover:shadow-chart-1/25",
    "active:scale-95",
  ),

  // Secondary/outline button
  secondary: cn(
    "rounded-xl bg-transparent relative overflow-hidden group",
    "transition-all duration-300",
    "hover:shadow-lg hover:shadow-muted/50",
    "hover:border-muted-foreground/50",
  ),

  // Ghost button with hover scale
  ghost: cn("rounded-xl transition-all duration-300", "hover:bg-accent", "hover:scale-105 active:scale-95"),

  // Icon button
  icon: cn("h-8 w-8 rounded-xl transition-all duration-300", "hover:scale-110 active:scale-95"),

  iconBlue: cn(
    "h-8 w-8 rounded-xl transition-all duration-300",
    "hover:bg-info-muted",
    "hover:scale-110 active:scale-95 hover:text-info",
  ),

  // Disabled state
  disabled: "disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",

  // Cancel button
  cancel: cn("rounded-xl transition-all duration-300", "hover:bg-accent", "hover:scale-105 active:scale-95"),
}

// ============================================
// CARD STYLES
// ============================================

export const cardStyles = {
  base: cn(
    "rounded-2xl shadow-md",
    "hover:shadow-xl transition-all duration-500",
    "bg-card",
    "border-0 overflow-hidden",
  ),

  // Card with lift effect on hover
  lift: cn(
    "rounded-2xl shadow-md",
    "hover:shadow-xl transition-all duration-500",
    "bg-card",
    "border-0 overflow-hidden group",
    "hover:-translate-y-1",
  ),

  // Card with stronger lift (for grid items)
  liftStrong: cn(
    "rounded-2xl shadow-md",
    "hover:shadow-xl transition-all duration-500",
    "bg-card",
    "border-0 overflow-hidden group",
    "hover:-translate-y-2",
  ),

  // Animated card with fade-in from bottom
  animated: cn("animate-in fade-in slide-in-from-bottom-4"),
}

// ============================================
// INPUT STYLES
// ============================================

export const inputStyles = {
  base: cn("rounded-xl transition-all duration-300", "focus:ring-2 focus:ring-ring/20 focus:border-ring"),

  // Search input
  search: cn(
    "rounded-xl transition-all duration-300",
    "focus:ring-2 focus:ring-ring/20 focus:border-ring",
    "focus:shadow-lg focus:shadow-ring/10",
  ),

  // Select trigger
  select: cn("rounded-xl transition-all duration-300", "hover:shadow-md focus:ring-2 focus:ring-ring/20"),
}

// ============================================
// ICON CONTAINER STYLES
// ============================================

export const iconContainerStyles = {
  base: (
    color: "info" | "success" | "warning" | "destructive" | "muted" | "chart-1" | "chart-2" | "chart-3" | "chart-4",
  ) => {
    const colors = {
      info: "bg-info-muted",
      success: "bg-success-muted",
      warning: "bg-warning-muted",
      destructive: "bg-destructive/10",
      muted: "bg-muted",
      "chart-1": "bg-chart-1/10",
      "chart-2": "bg-chart-2/10",
      "chart-3": "bg-chart-3/10",
      "chart-4": "bg-chart-4/10",
    }
    return cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      colors[color],
      "transition-transform duration-300",
      "group-hover:scale-110",
    )
  },

  // Icon container with rotation on hover
  withRotation: (
    color: "info" | "success" | "warning" | "destructive" | "muted" | "chart-1" | "chart-2" | "chart-3" | "chart-4",
  ) => {
    const colors = {
      info: "bg-info-muted",
      success: "bg-success-muted",
      warning: "bg-warning-muted",
      destructive: "bg-destructive/10",
      muted: "bg-muted",
      "chart-1": "bg-chart-1/10",
      "chart-2": "bg-chart-2/10",
      "chart-3": "bg-chart-3/10",
      "chart-4": "bg-chart-4/10",
    }
    return cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      colors[color],
      "transition-all duration-300",
      "group-hover:scale-110 group-hover:rotate-3",
    )
  },

  avatar: cn(
    "w-12 h-12 rounded-xl",
    "bg-primary",
    "flex items-center justify-center",
    "text-primary-foreground font-semibold text-lg",
    "group-hover:scale-110 group-hover:rotate-3",
    "transition-all duration-300",
    "group-hover:shadow-lg group-hover:shadow-primary/30",
  ),

  // Extra large for dialogs
  avatarLarge: cn(
    "w-16 h-16 rounded-2xl",
    "bg-primary",
    "flex items-center justify-center",
    "text-primary-foreground text-2xl font-bold",
    "shadow-lg shadow-primary/25",
    "transition-transform duration-300",
    "hover:scale-105 hover:rotate-3",
  ),
}

// ============================================
// ICON COLORS
// ============================================

export const iconColors = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
  "chart-1": "text-chart-1",
  "chart-2": "text-chart-2",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
}

// ============================================
// DROPDOWN MENU STYLES
// ============================================

export const dropdownStyles = {
  content: "rounded-xl animate-in fade-in zoom-in-95 duration-200",

  item: "cursor-pointer rounded-lg transition-colors duration-200",

  itemBlue: cn("cursor-pointer rounded-lg transition-colors duration-200", "hover:bg-info-muted hover:text-info"),

  itemRed: cn(
    "cursor-pointer rounded-lg text-destructive",
    "focus:text-destructive focus:bg-destructive/10",
    "transition-colors duration-200",
  ),
}

// ============================================
// DIALOG STYLES
// ============================================

export const dialogStyles = {
  content: "rounded-2xl animate-in zoom-in-95 duration-300",
  contentScroll: "rounded-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300",
}

// ============================================
// BADGE STYLES
// ============================================

export const badgeStyles = {
  base: "text-xs rounded-lg capitalize transition-transform duration-200 hover:scale-105",

  status: {
    inStock: "bg-success-muted text-success",
    lowStock: "bg-warning-muted text-warning",
    outOfStock: "bg-destructive/10 text-destructive",
    available: "bg-success-muted text-success",
    rented: "bg-info-muted text-info",
    maintenance: "bg-warning-muted text-warning",
    reserved: "bg-chart-4/10 text-chart-4",
  },

  condition: {
    excellent: "bg-success-muted text-success",
    good: "bg-info-muted text-info",
    fair: "bg-warning-muted text-warning",
    poor: "bg-destructive/10 text-destructive",
  },

  active: cn("bg-success-muted text-success", "animate-pulse"),
}

// ============================================
// CLICKABLE INFO ROW STYLES
// ============================================

export const clickableRowStyles = {
  base: cn(
    "flex items-center justify-between gap-2 text-sm",
    "transition-all duration-200 cursor-pointer",
    "rounded-lg px-2 py-1.5 -mx-2",
  ),

  blue: cn(
    "flex items-center justify-between gap-2 text-sm group/item",
    "hover:text-info transition-all duration-200 cursor-pointer",
    "hover:bg-info-muted rounded-lg px-2 py-1.5 -mx-2",
  ),

  green: cn(
    "flex items-center justify-between gap-2 text-sm group/item",
    "hover:text-success transition-all duration-200 cursor-pointer",
    "hover:bg-success-muted rounded-lg px-2 py-1.5 -mx-2",
  ),

  purple: cn(
    "flex items-center justify-between gap-2 text-sm group/item",
    "hover:text-chart-4 transition-all duration-200 cursor-pointer",
    "hover:bg-chart-4/10 rounded-lg px-2 py-1.5 -mx-2",
  ),
}

// ============================================
// VIEW DIALOG INFO CARD STYLES
// ============================================

export const infoCardStyles = {
  base: (color: "info" | "success" | "warning" | "muted" | "chart-4") => {
    const hoverColors = {
      info: "hover:bg-info-muted",
      success: "hover:bg-success-muted",
      warning: "hover:bg-warning-muted",
      muted: "hover:bg-muted",
      "chart-4": "hover:bg-chart-4/10",
    }
    return cn(
      "flex items-center gap-3 p-3 rounded-xl",
      "bg-muted/50",
      "transition-all duration-300 group cursor-pointer",
      hoverColors[color],
    )
  },
}

// ============================================
// ANIMATION UTILITIES
// ============================================

export const animations = {
  // Staggered animation delay generator
  staggerDelay: (index: number, baseDelay = 50) => ({
    animationDelay: `${index * baseDelay}ms`,
    animationFillMode: "both" as const,
  }),

  // Fade in from bottom with stagger
  fadeInUp: (index: number) => ({
    className: "animate-in fade-in slide-in-from-bottom-4 duration-500",
    style: { animationDelay: `${index * 100}ms`, animationFillMode: "both" as const },
  }),
}

// ============================================
// OVERLAY ELEMENTS
// ============================================

export const overlayStyles = {
  buttonGradientOverlay: cn(
    "absolute inset-0",
    "bg-accent",
    "opacity-0 group-hover:opacity-20",
    "transition-opacity duration-300",
  ),

  // Glow effect for buttons
  buttonGlow: cn(
    "absolute -inset-1",
    "bg-primary",
    "rounded-xl blur opacity-0",
    "group-hover:opacity-30",
    "transition-opacity duration-500",
  ),

  // Shimmer effect
  shimmer: cn(
    "absolute inset-0",
    "bg-gradient-to-r from-background/0 via-background/20 to-background/0",
    "translate-x-[-100%] group-hover:translate-x-[100%]",
    "transition-transform duration-700",
  ),

  // Secondary button gradient overlay
  secondaryGradientOverlay: cn(
    "absolute inset-0",
    "bg-muted",
    "opacity-0 group-hover:opacity-100",
    "transition-opacity duration-300",
  ),
}

// ============================================
// COMPLETE COMPONENT CLASS PRESETS
// ============================================

export const ds = {
  button: buttonStyles,
  card: cardStyles,
  input: inputStyles,
  iconContainer: iconContainerStyles,
  iconColor: iconColors,
  dropdown: dropdownStyles,
  dialog: dialogStyles,
  badge: badgeStyles,
  clickableRow: clickableRowStyles,
  infoCard: infoCardStyles,
  animation: animations,
  overlay: overlayStyles,
}

export default ds

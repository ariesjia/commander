"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "neon" | "neon-orange";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const base =
  "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-p-accent text-white hover:bg-p-accent-hover focus:ring-p-accent rounded-lg",
  secondary:
    "bg-white text-p-primary border border-p-border hover:bg-gray-50 focus:ring-p-accent rounded-lg",
  danger:
    "bg-p-danger text-white hover:bg-red-600 focus:ring-p-danger rounded-lg",
  ghost:
    "text-p-text-secondary hover:bg-gray-100 focus:ring-p-accent rounded-lg",
  neon:
    "bg-transparent text-s-primary border border-s-primary/40 hover:border-s-primary hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] focus:ring-s-primary rounded-lg",
  "neon-orange":
    "bg-s-accent text-white hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] focus:ring-s-accent rounded-lg",
};

const sizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[48px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

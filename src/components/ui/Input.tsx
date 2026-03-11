"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-p-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-p-border bg-white px-3 py-2.5 text-sm text-p-text transition-colors duration-200",
            "placeholder:text-p-text-secondary/60",
            "focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent/20",
            error && "border-p-danger focus:border-p-danger focus:ring-p-danger/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-p-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

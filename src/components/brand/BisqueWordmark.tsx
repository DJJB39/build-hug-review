import * as React from "react";

import { cn } from "@/lib/utils";

interface BisqueMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
}

/**
 * Bisque mark — a single croquet ball passing through a hoop, abstracted.
 * Uses currentColor so it adopts the surrounding text colour.
 */
export function BisqueMark({ size = 28, className, ...props }: BisqueMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("inline-block", className)}
      {...props}
    >
      {/* Hoop */}
      <path d="M7 24 V13 a9 9 0 0 1 18 0 V24" />
      {/* Ball */}
      <circle cx="16" cy="22" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface BisqueWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  showMark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { text: "text-lg", mark: 20 },
  md: { text: "text-2xl", mark: 28 },
  lg: { text: "text-4xl", mark: 40 },
  xl: { text: "text-6xl md:text-7xl", mark: 56 },
};

export function BisqueWordmark({
  showMark = true,
  size = "md",
  className,
  ...props
}: BisqueWordmarkProps) {
  const cfg = sizeMap[size];
  return (
    <span
      className={cn("inline-flex items-baseline gap-2 font-display font-medium", className)}
      {...props}
    >
      {showMark && (
        <span className="translate-y-[2px] text-primary">
          <BisqueMark size={cfg.mark} />
        </span>
      )}
      <span className={cn(cfg.text, "tracking-tight")}>Bisque</span>
    </span>
  );
}

"use client";

import type { JSX } from "react";

import { cn } from "../../lib/utils";

interface GlowButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  isDisabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function GlowButton({
  label,
  onClick,
  className,
  isDisabled = false,
  type = "button",
}: GlowButtonProps): JSX.Element {
  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={cn(
        "relative rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-black transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-white cursor-pointer",
        className,
      )}
    >
      <span>{label}</span>
      <span className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-linear-to-r from-transparent via-blue-500 to-transparent" />
    </button>
  );
}

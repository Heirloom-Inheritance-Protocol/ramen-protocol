"use client";

import { JSX } from "react";
import { cn } from "@/lib/utils";

interface CreateInheritanceButtonProps {
  uploadingStage?: "idle" | "ipfs" | "blockchain";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export function CreateInheritanceButton({
  uploadingStage = "idle",
  disabled = false,
  className,
  type = "submit",
  onClick,
}: CreateInheritanceButtonProps): JSX.Element {
  const getButtonText = () => {
    switch (uploadingStage) {
      case "ipfs":
        return "Uploading to ARKIV...";
      case "blockchain":
        return "Creating on Blockchain...";
      default:
        return "Create Inheritance";
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:hover:bg-white cursor-pointer",
        className,
      )}
    >
      {getButtonText()}
    </button>
  );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { BackgroundLines } from "@/components/ui/background-lines";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import ConnectWallet from "./ui/ConnectWallet";
import { GlowButton } from "./ui/glow-button";

export function BackgroundLinesHero() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  function handleNavigateDashboard(): void {
    router.push("/dashboard");
  }

  return (
    <BackgroundLines className="w-full px-4 pb-8 pt-[calc(env(safe-area-inset-top)+4.5rem)] sm:pb-16 sm:pt-24 lg:py-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <TextGenerateEffect
          words="Ramen Protocol."
          className="w-full text-3xl leading-tight md:text-5xl lg:text-6xl"
        />
        <p className="text-base text-neutral-700 dark:text-neutral-400 md:text-lg">
          Record who passed knowledge to whom on-chain, preserving lineage and
          provenance. Encrypt content client-side and store on ARKIV, enabling
          preservation of private cultural assets without forcing public
          disclosure.
        </p>
        <div className="w-full max-w-md">
          {ready && authenticated ? (
            <GlowButton
              label="Dashboard"
              onClick={handleNavigateDashboard}
              className="w-full sm:w-auto"
            />
          ) : (
            <ConnectWallet />
          )}
        </div>
      </div>
    </BackgroundLines>
  );
}
